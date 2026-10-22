import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { payableNow, modeLabel } from "@/lib/payment-modes";

/**
 * Automatic booking payment lifecycle — zero manual admin work.
 *
 * Three engines keep paymentStatus truthful at all times:
 *   1. Razorpay webhook (/api/webhooks/razorpay)      — instant, event-driven
 *   2. Client verify (/api/razorpay/verify)           — instant, on-callback
 *   3. Reconciliation sweep (sweepBookings)           — heals anything missed:
 *        a. pending online bookings whose gateway session died → auto-CANCELLED
 *           after a configurable window (default 30 min; set the
 *           bookings_pending_cancel_minutes setting to 0 to never cancel) so
 *           inventory frees up
 *        b. pending bookings with a Razorpay order → payment status pulled
 *           straight from the Razorpay API (captures the "paid but webhook
 *           lost / browser closed before callback" cases)
 *
 * Owner WhatsApp notifications ride the same events (new booking, payment
 * received, auto-cancel) via CallMeBot — configured in Admin → Payment
 * Settings → WhatsApp Notifications.
 */

export const SWEEP_DEFAULT_CANCEL_MINUTES = 30;
// Never sweep Razorpay lookups for orders older than this — legacy/noise guard.
const RECONCILE_MAX_AGE_DAYS = 7;
// Bound a single sweep so admin page loads stay snappy.
const MAX_RECONCILE_PER_SWEEP = 10;

async function getSetting(key: string): Promise<string> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? "";
}

async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } });
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

function makeRazorpay(keyId: string, keySecret: string): Razorpay {
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ---------------------------------------------------------------------------
// WhatsApp owner notifications (CallMeBot — free personal gateway)
// ---------------------------------------------------------------------------

function waEnabled(cfg: Record<string, string>): boolean {
  return (
    cfg.whatsapp_enabled === "true" &&
    !!cfg.whatsapp_owner_phone &&
    !!cfg.whatsapp_api_key
  );
}

/** Fire-and-forget owner WhatsApp message. Never throws. */
export async function notifyOwnerWhatsApp(text: string): Promise<boolean> {
  try {
    const cfg = await getSettings(["whatsapp_enabled", "whatsapp_owner_phone", "whatsapp_api_key"]);
    if (!waEnabled(cfg)) return false;
    const url =
      `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cfg.whatsapp_owner_phone)}` +
      `&text=${encodeURIComponent(text.slice(0, 900))}` +
      `&apikey=${encodeURIComponent(cfg.whatsapp_api_key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) {
      console.error("[whatsapp-notify] CallMeBot responded", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[whatsapp-notify] failed:", e);
    return false;
  }
}

function fmtINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Rich owner notification text with full booking detail. */
export function bookingWhatsAppText(
  b: {
    referenceCode: string; guestName: string; guestPhone: string; guestEmail: string;
    checkIn: Date | string; checkOut: Date | string; nights: number;
    adults: number; children: number; totalAmount: number; paidAmount: number;
    paymentMethod: string | null; paymentStatus: string; planName?: string | null;
  },
  roomName: string,
  kind: "NEW" | "PAID" | "CANCELLED"
): string {
  const mode = modeLabel(b.paymentMethod || "PREPAID");
  const now = payableNow(b.paymentMethod || "PREPAID", b.totalAmount);
  const dueHotel = Math.max(b.totalAmount - b.paidAmount, 0);
  const guests = `${b.adults}A${b.children ? ` + ${b.children}C` : ""}`;
  const head = kind === "PAID" ? "PAYMENT RECEIVED" : kind === "CANCELLED" ? "BOOKING AUTO-CANCELLED" : "NEW WEBSITE BOOKING";
  const lines = [
    `*${head} — RK Residency*`,
    `Ref: ${b.referenceCode}`,
    `Guest: ${b.guestName} (${b.guestPhone})`,
    `Room: ${roomName}${b.planName ? ` · Plan: ${b.planName}` : ""}`,
    `${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)} · ${b.nights}N · ${guests}`,
    `Total: ${fmtINR(b.totalAmount)} (incl. 5% GST)`,
    `Mode: ${mode}`,
  ];
  if (kind === "NEW") {
    lines.push(
      `Pay now: ${fmtINR(now)} · At hotel: ${fmtINR(Math.max(b.totalAmount - now, 0))}`,
      `Payment status: ${b.paymentStatus === "PAID" ? "PAID" : b.paymentStatus === "PARTIAL" ? "ADVANCE PAID" : "PENDING"}`
    );
  } else if (kind === "PAID") {
    lines.push(`Collected: ${fmtINR(b.paidAmount)} · Remaining at hotel: ${fmtINR(dueHotel)}`);
  } else {
    lines.push(`Reason: online payment not completed within the pending window. Inventory released.`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Shared capture logic (used by webhook + verify + reconciliation sweep)
// ---------------------------------------------------------------------------

/** Idempotent, mode-aware "money captured" write. Returns true if a state change happened. */
export async function applyCapturedPayment(
  bookingId: string,
  paymentRef: string,
  opts?: { notifyRoomName?: string }
): Promise<boolean> {
  const existing = await db.booking.findUnique({ where: { id: bookingId } });
  if (!existing) return false;
  const settled = existing.paymentStatus === "PAID" || existing.paymentStatus === "PARTIAL";
  if (settled) {
    // Already settled (webhook + verify race) — just touch syncedAt.
    await db.booking.update({ where: { id: bookingId }, data: { syncedAt: new Date() } });
    return false;
  }
  const paid = payableNow(existing.paymentMethod || "PREPAID", existing.totalAmount);
  await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: existing.paymentMethod === "PARTIAL_PAID" ? "PARTIAL" : "PAID",
      paidAmount: paid,
      paymentRef,
      syncedAt: new Date(),
    },
  });
  if (opts?.notifyRoomName) {
    await notifyOwnerWhatsApp(
      bookingWhatsAppText({ ...existing, paidAmount: paid, paymentStatus: existing.paymentMethod === "PARTIAL_PAID" ? "PARTIAL" : "PAID" }, opts.notifyRoomName, "PAID")
    );
  }
  return true;
}

// ---------------------------------------------------------------------------
// Reconciliation + auto-cancel sweep
// ---------------------------------------------------------------------------

/** Pull payment truth from the Razorpay API for one pending booking. */
async function reconcileBooking(b: { id: string; razorpayOrderId: string | null; paymentMethod: string | null; totalAmount: number; paymentStatus: string; room?: { name: string } | null }): Promise<boolean> {
  if (!b.razorpayOrderId || b.paymentMethod === "PAY_AT_HOTEL") return false;
  if (b.paymentStatus === "PAID" || b.paymentStatus === "PARTIAL") return false;
  const keyId = await getSetting("razorpay_key_id");
  const keySecret = await getSetting("razorpay_key_secret");
  if (!keyId || !keySecret) return false;
  try {
    const rzp = makeRazorpay(keyId, keySecret);
    // SDK: orders.fetchPayments → { items: [...] } (older shapes: plain array)
    const raw: any = await (rzp.orders as any).fetchPayments(b.razorpayOrderId);
    const items: any[] = Array.isArray(raw) ? raw : raw?.items || [];
    const captured = items.find((p) => p.status === "captured");
    if (captured) {
      const applied = await applyCapturedPayment(b.id, captured.id, { notifyRoomName: b.room?.name });
      console.log(`[booking-sync] reconciled ${b.id} → captured (${captured.id})`);
      return applied;
    }
    await db.booking.update({ where: { id: b.id }, data: { syncedAt: new Date() } });
    return false;
  } catch (e) {
    console.error(`[booking-sync] reconcile failed for ${b.id}:`, e);
    return false;
  }
}

export interface SweepResult {
  cancelled: number;
  reconciledPaid: number;
  skipped: boolean;
}

/**
 * Full sweep — safe to call on every admin bookings load and from cron.
 *  a) auto-cancel abandoned online-payment bookings past the pending window
 *  b) pull Razorpay truth for pending bookings that have an order id
 */
export async function sweepBookings(): Promise<SweepResult> {
  const result: SweepResult = { cancelled: 0, reconciledPaid: 0, skipped: false };
  try {
    const cfg = await getSettings(["bookings_pending_cancel_minutes"]);
    const rawMinutes = parseInt(cfg.bookings_pending_cancel_minutes || "", 10);
    // 0 (or negative) = auto-cancel DISABLED — unpaid online bookings stay
    // PENDING so the owner can follow up / collect manually. Inventory can
    // always be freed by cancelling the booking from the admin panel.
    const minutes: number | null =
      Number.isFinite(rawMinutes) && rawMinutes <= 0
        ? null
        : Math.max(5, rawMinutes || SWEEP_DEFAULT_CANCEL_MINUTES);
    const oldest = new Date(Date.now() - RECONCILE_MAX_AGE_DAYS * 86_400_000);

    // (a) abandoned gateway sessions → CANCELLED + release inventory
    //     (skipped entirely when the window is 0 = never auto-cancel)
    if (minutes !== null) {
      const cutoff = new Date(Date.now() - minutes * 60_000);
      const abandoned = await db.booking.findMany({
        where: {
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          paymentMethod: { in: ["PREPAID", "PARTIAL_PAID"] },
          createdAt: { lt: cutoff },
        },
        select: { id: true, referenceCode: true },
        take: 25,
      });
      if (abandoned.length > 0) {
        const upd = await db.booking.updateMany({
          where: { id: { in: abandoned.map((b) => b.id) } },
          data: { status: "CANCELLED", paymentStatus: "FAILED", syncedAt: new Date() },
        });
        result.cancelled = upd.count;
        for (const b of abandoned) {
          console.log(`[booking-sync] auto-cancelled ${b.referenceCode} (no payment in ${minutes} min)`);
          await notifyOwnerWhatsApp(
            `*BOOKING AUTO-CANCELLED — RK Residency*\n` +
            `Ref: ${b.referenceCode}\n` +
            `Reason: online payment not completed within ${minutes} min. Inventory released.`
          );
        }
      }
    }

    // (b) paid-at-gateway but DB still PENDING → pull truth from Razorpay
    const pending = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        razorpayOrderId: { not: null },
        createdAt: { gte: oldest },
        paymentMethod: { not: "PAY_AT_HOTEL" },
      },
      include: { room: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_RECONCILE_PER_SWEEP,
    });
    for (const b of pending) {
      const changed = await reconcileBooking(b);
      if (changed) result.reconciledPaid++;
    }
  } catch (e) {
    console.error("[booking-sync] sweep failed:", e);
    result.skipped = true;
  }
  return result;
}
