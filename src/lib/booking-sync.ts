import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { payableNow, modeLabel } from "@/lib/payment-modes";
import { internalApiSecret } from "@/lib/internal-secret";

/**
 * Automatic booking payment lifecycle — zero manual admin work.
 *
 * Three engines keep paymentStatus truthful at all times:
 *   1. Razorpay webhook (/api/webhooks/razorpay)      — instant, event-driven
 *   2. Client verify (/api/razorpay/verify)           — instant, on-callback
 *   3. Reconciliation sweep (sweepBookings)           — heals anything missed:
 *        a. pending online bookings whose gateway session died → auto-CANCELLED
 *           after a configurable window (default 5 min — owner wants
 *           near-immediate release; set bookings_pending_cancel_minutes to 0
 *           to never cancel) so inventory frees up. Closing the Razorpay modal
 *           cancels the booking INSTANTLY via /api/bookings/abandon — this
 *           sweep is the safety net for closed tabs, re-driven on ordinary
 *           site traffic through maybeSweepBookings().
 *        b. pending bookings with a Razorpay order → payment status pulled
 *           straight from the Razorpay API (captures the "paid but webhook
 *           lost / browser closed before callback" cases)
 *
 * Owner WhatsApp notifications ride the same events (new booking, payment
 * received, auto-cancel) via the configured gateway — CallMeBot, UltraMsg,
 * Green API or AiSensy (Meta official API) — chosen in Admin → Payment
 * Settings → WhatsApp Notifications.
 */

export const SWEEP_DEFAULT_CANCEL_MINUTES = 5;
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
// WhatsApp owner notifications (multi-gateway: CallMeBot | UltraMsg | Green API | AiSensy)
// ---------------------------------------------------------------------------

function waEnabled(cfg: Record<string, string>): boolean {
  return (
    cfg.whatsapp_enabled === "true" &&
    !!cfg.whatsapp_owner_phone &&
    !!cfg.whatsapp_api_key
  );
}

/**
 * Send one WhatsApp message to the owner through the configured gateway.
 * Four interchangeable providers (owner's choice in Admin → Payment Settings):
 *   - callmebot (default)  — key from +34 644 51 95 23 registration, plain GET
 *   - ultramsg             — owner's own WhatsApp linked via QR scan
 *                            POST https://api.ultramsg.com/{instance}/messages/chat
 *   - greenapi             — owner's own WhatsApp linked via QR scan
 *                            POST https://api.green-api.com/waInstance{id}/sendMessage/{token}
 *   - aisensy              — Meta OFFICIAL WhatsApp Business API via AiSensy
 *                            (delivery guaranteed, template-approved; needs a
 *                            utility template with ONE body variable {{1}} and
 *                            an API campaign using it — the whole alert text
 *                            rides templateParams[0])
 *                            POST https://backend.aisensy.com/campaign/t1/api/v2
 * All four reuse the same SiteSetting keys: whatsapp_enabled,
 * whatsapp_owner_phone, whatsapp_api_key (+ provider-specific campaign/
 * instance id).
 * Fire-and-forget. Never throws. Returns true only on a provider-confirmed send.
 */
export async function notifyOwnerWhatsApp(text: string): Promise<boolean> {
  try {
    const cfg = await getSettings([
      "whatsapp_enabled",
      "whatsapp_owner_phone",
      "whatsapp_api_key",
      "whatsapp_provider",
      "whatsapp_ultramsg_instance",
      "whatsapp_greenapi_instance",
      "whatsapp_aisensy_campaign",
    ]);
    if (!waEnabled(cfg)) return false;
    const provider = (cfg.whatsapp_provider || "callmebot").trim().toLowerCase();
    const digits = cfg.whatsapp_owner_phone.replace(/\D/g, "");
    const key = cfg.whatsapp_api_key;

    if (provider === "ultramsg") {
      const instance = (cfg.whatsapp_ultramsg_instance || "").trim();
      if (!instance) {
        console.error("[whatsapp-notify] ultramsg selected but whatsapp_ultramsg_instance missing");
        return false;
      }
      const res = await fetch(
        `https://api.ultramsg.com/${encodeURIComponent(instance)}/messages/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token: key,
            to: digits,
            body: text.slice(0, 4096),
          }).toString(),
          signal: AbortSignal.timeout(10_000),
        }
      );
      const parsed: any = await res.json().catch(() => null);
      const ok = res.ok && (parsed?.sent === "true" || parsed?.sent === true);
      if (!ok) console.error("[whatsapp-notify] UltraMsg responded", res.status, JSON.stringify(parsed)?.slice(0, 200));
      return ok;
    }

    if (provider === "greenapi") {
      const instance = (cfg.whatsapp_greenapi_instance || "").trim();
      if (!instance) {
        console.error("[whatsapp-notify] greenapi selected but whatsapp_greenapi_instance missing");
        return false;
      }
      const res = await fetch(
        `https://api.green-api.com/waInstance${encodeURIComponent(instance)}/sendMessage/${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: `${digits}@c.us`, message: text.slice(0, 4000) }),
          signal: AbortSignal.timeout(10_000),
        }
      );
      const parsed: any = await res.json().catch(() => null);
      const ok = res.ok && !!parsed?.idMessage;
      if (!ok) console.error("[whatsapp-notify] Green API responded", res.status, JSON.stringify(parsed)?.slice(0, 200));
      return ok;
    }

    if (provider === "aisensy") {
      const campaign = (cfg.whatsapp_aisensy_campaign || "").trim();
      if (!campaign) {
        console.error("[whatsapp-notify] aisensy selected but whatsapp_aisensy_campaign missing");
        return false;
      }
      // AiSensy Campaign API v2 — Meta official WhatsApp Business API.
      // templateParams render literally (no markdown), so WhatsApp bold/italic
      // markers are stripped for clean display.
      const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          campaignName: campaign,
          destination: digits,
          userName: "RK Residency Owner",
          source: "website-bookings",
          templateParams: [text.replace(/[*_~`]/g, "").slice(0, 1024)],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const parsed: any = await res.json().catch(() => null);
      const ok = res.ok && parsed?.success !== false;
      if (!ok) console.error("[whatsapp-notify] AiSensy responded", res.status, JSON.stringify(parsed)?.slice(0, 200));
      return ok;
    }

    // Default: CallMeBot (free personal gateway)
    const url =
      `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cfg.whatsapp_owner_phone)}` +
      `&text=${encodeURIComponent(text.slice(0, 900))}` +
      `&apikey=${encodeURIComponent(key)}`;
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
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
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
/**
 * Fire-and-forget guest confirmation email (voucher + invoice links).
 * Called only when money actually lands, so the guest never receives a
 * PENDING voucher — the email renders the settled payment state.
 */
export async function fireConfirmationEmail(bookingId: string): Promise<void> {
  const base = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.rkresidencyvrindavan.in"
  ).replace(/\/+$/, "");
  // Authenticated internal call — the confirmation endpoint rejects requests
  // without the shared secret (blocks external email/coupon abuse).
  const secret = await internalApiSecret();
  fetch(`${base}/api/booking-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-key": secret },
    body: JSON.stringify({ bookingId }),
  }).catch(() => {});
}

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
  const settledStatus = existing.paymentMethod === "PARTIAL_PAID" ? "PARTIAL" : "PAID";

  // ── Money arrived for a booking that was already auto-cancelled ──
  // (guest was mid-payment when the immediate/short-window cancel fired).
  // Revive the booking if the slot is still free; otherwise keep it cancelled
  // and raise a loud refund alert instead of silently marking a dead row paid.
  if (existing.status === "CANCELLED") {
    const clash = await db.booking.findFirst({
      where: {
        roomId: existing.roomId,
        id: { not: existing.id },
        status: { not: "CANCELLED" },
        AND: [{ checkIn: { lt: existing.checkOut } }, { checkOut: { gt: existing.checkIn } }],
      },
      select: { id: true },
    });
    if (clash) {
      await notifyOwnerWhatsApp(
        `*⚠ PAYMENT RECEIVED ON CANCELLED BOOKING — RK Residency*\n` +
        `Ref: ${existing.referenceCode}\n` +
        `Guest: ${existing.guestName} (${existing.guestPhone})\n` +
        `${fmtDate(existing.checkIn)} → ${fmtDate(existing.checkOut)}\n` +
        `Amount received: ${fmtINR(paid)} (payment ref ${paymentRef})\n` +
        `Slot is no longer free — PLEASE REFUND this amount from the Razorpay dashboard.`
      );
      return false;
    }
    // Slot still free → bring the booking back as if the guest paid in time.
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: settledStatus,
        paidAmount: paid,
        paymentRef,
        syncedAt: new Date(),
      },
    });
    console.log(`[booking-sync] re-activated cancelled booking ${existing.referenceCode} — late payment captured`);
    // Money landed → booking is final: email the guest the PAID voucher now.
    fireConfirmationEmail(bookingId);
    if (opts?.notifyRoomName) {
      await notifyOwnerWhatsApp(
        `*PAYMENT RECEIVED — booking auto re-activated — RK Residency*\n` +
        bookingWhatsAppText({ ...existing, paidAmount: paid, paymentStatus: settledStatus }, opts.notifyRoomName, "PAID")
      );
    }
    return true;
  }

  // ── Final guard against double-booking ──
  // Two PENDING bookings can legally co-exist for the same slot (creation only
  // counts CONFIRMED overlaps), so BEFORE flipping this one to CONFIRMED we
  // re-check the slot. If another booking already holds it, keep this row
  // PENDING (do NOT consume the money silently) and raise a loud refund alert.
  const clash = await db.booking.findFirst({
    where: {
      roomId: existing.roomId,
      id: { not: existing.id },
      status: "CONFIRMED",
      AND: [{ checkIn: { lt: existing.checkOut } }, { checkOut: { gt: existing.checkIn } }],
    },
    select: { id: true, referenceCode: true, guestName: true },
  });
  if (clash) {
    await notifyOwnerWhatsApp(
      `*⚠ DOUBLE-BOOKING BLOCKED — REFUND NEEDED — RK Residency*\n` +
      `Ref: ${existing.referenceCode}\n` +
      `Guest: ${existing.guestName} (${existing.guestPhone})\n` +
      `${fmtDate(existing.checkIn)} → ${fmtDate(existing.checkOut)}\n` +
      `Amount received: ${fmtINR(paid)} (payment ref ${paymentRef})\n` +
      `Slot already held by ${clash.referenceCode} (${clash.guestName}).\n` +
      `Booking left PENDING — PLEASE REFUND from the Razorpay dashboard.`
    );
    await db.booking.update({
      where: { id: bookingId },
      data: { paymentRef, syncedAt: new Date() },
    });
    return true;
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      // Owner's rule: online bookings (PREPAID / PARTIAL_PAID) are created as
      // PENDING and only become final (CONFIRMED) when money actually lands.
      // For bookings that were already CONFIRMED this is a harmless no-op.
      status: "CONFIRMED",
      paymentStatus: settledStatus,
      paidAmount: paid,
      paymentRef,
      syncedAt: new Date(),
    },
  });
  if (opts?.notifyRoomName) {
    await notifyOwnerWhatsApp(
      bookingWhatsAppText({ ...existing, paidAmount: paid, paymentStatus: settledStatus }, opts.notifyRoomName, "PAID")
    );
  }
  // Money landed → booking is final: generate voucher/invoice state and email
  // the guest (only now — the email never shows PENDING).
  fireConfirmationEmail(bookingId);
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
    // Floor of 5 min protects guests who are mid-payment (UPI/card can take
    // a couple of minutes); applyCapturedPayment revives a cancelled booking
    // if money still lands while the slot is free.
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
          status: { in: ["PENDING", "CONFIRMED"] },
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
        status: { in: ["PENDING", "CONFIRMED"] },
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

// ---------------------------------------------------------------------------
// Frequent light sweep — piggybacked on ordinary public traffic via after(),
// so the short auto-cancel window actually fires without waiting for cron or
// an admin panel visit.
// ---------------------------------------------------------------------------

const SWEEP_THROTTLE_MS = 60_000;
let lastSweepAt = 0;
let sweeping = false;

/** Fire-and-forget, throttled to at most one run per minute per instance. */
export function maybeSweepBookings(): void {
  const now = Date.now();
  if (sweeping || now - lastSweepAt < SWEEP_THROTTLE_MS) return;
  lastSweepAt = now;
  sweeping = true;
  sweepBookings()
    .catch((e) => console.error("[booking-sync] maybeSweep failed:", e))
    .finally(() => {
      sweeping = false;
    });
}
