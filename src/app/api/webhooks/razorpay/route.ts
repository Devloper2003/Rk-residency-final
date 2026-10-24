import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { applyCapturedPayment, notifyOwnerWhatsApp } from "@/lib/booking-sync";
import { payableNow } from "@/lib/payment-modes";

export const dynamic = "force-dynamic";

/**
 * Helper: read a SiteSetting value from the database.
 */
async function getSetting(key: string): Promise<string> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? "";
}

/**
 * Verify the webhook signature sent by Razorpay.
 * Uses the webhook_secret stored in SiteSetting table.
 */
function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay sends server-to-server webhook notifications here.
 * We verify the signature and update booking status accordingly.
 *
 * Handled events:
 *   - payment.captured  → mark booking PAID
 *   - payment.failed    → mark booking CANCELLED
 */
export async function POST(req: Request) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-razorpay-signature");

    // 2. Get webhook secret from DB
    const webhookSecret = await getSetting("razorpay_webhook_secret");
    if (!webhookSecret) {
      console.warn("[/api/webhooks/razorpay] webhook_secret not configured");
      return NextResponse.json({ error: "Not configured." }, { status: 503 });
    }

    // 3. Verify signature
    if (!verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      console.warn("[/api/webhooks/razorpay] Invalid signature");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    // 4. Parse the event
    const event = JSON.parse(rawBody);
    const { event: eventType } = event;
    const payment = event.payload?.payment?.entity;

    if (!payment) {
      console.warn("[/api/webhooks/razorpay] No payment entity in payload");
      return NextResponse.json({ ok: true });
    }

    const paymentId = payment.id;
    const orderId = payment.order_id;
    const status = payment.status; // 'captured', 'failed', 'refunded'
    const notes = payment.notes || {};
    const bookingId = notes.bookingId;

    if (!bookingId) {
      console.warn(`[/api/webhooks/razorpay] No bookingId in notes for payment ${paymentId}`);
      return NextResponse.json({ ok: true });
    }

    // 5. Handle different events
    if (eventType === "payment.captured" && status === "captured") {
      // Mode-aware, idempotent (verify + webhook + sweep all share this path):
      // PARTIAL_PAID advance → PARTIAL (20% collected); PREPAID / legacy → PAID.
      // Owner WhatsApp "payment received" fires inside applyCapturedPayment.
      const existing = await db.booking.findUnique({ where: { id: bookingId }, include: { room: { select: { name: true } } } });
      if (existing) {
        // Amount binding: the captured amount must equal what this booking's
        // payment mode requires (server-derived). A mismatch means a payment
        // for a DIFFERENT (cheaper) booking landed under this bookingId —
        // never settle silently; raise a refund alert instead.
        const expectedPaise = payableNow(existing.paymentMethod || "PREPAID", existing.totalAmount) * 100;
        if (typeof payment.amount === "number" && payment.amount !== expectedPaise) {
          console.error(
            `[/api/webhooks/razorpay] AMOUNT MISMATCH booking=${existing.referenceCode} ` +
            `expected=${expectedPaise} got=${payment.amount} (${paymentId})`
          );
          await notifyOwnerWhatsApp(
            `*⚠ WRONG AMOUNT RECEIVED — RK Residency*\n` +
            `Ref: ${existing.referenceCode} (${existing.guestName})\n` +
            `Expected: ₹${(expectedPaise / 100).toLocaleString("en-IN")}\n` +
            `Received: ₹${(payment.amount / 100).toLocaleString("en-IN")} (${paymentId})\n` +
            `Booking NOT auto-confirmed — verify in Razorpay dashboard and refund if needed.`
          );
          return NextResponse.json({ ok: true, skipped: "amount_mismatch" });
        }
        // Order binding: the webhook payment must belong to the order stored
        // on this booking (legacy null rows are backfilled and allowed).
        if (existing.razorpayOrderId && orderId && existing.razorpayOrderId !== orderId) {
          console.error(`[/api/webhooks/razorpay] ORDER MISMATCH booking=${existing.referenceCode}`);
          return NextResponse.json({ ok: true, skipped: "order_mismatch" });
        }
        // Backfill the order link if an older booking row never stored it.
        if (!existing.razorpayOrderId && orderId) {
          await db.booking.update({ where: { id: bookingId }, data: { razorpayOrderId: orderId } });
        }
        const changed = await applyCapturedPayment(bookingId, paymentId, { notifyRoomName: existing.room?.name });
        console.log(`[/api/webhooks/razorpay] Booking ${bookingId} ${changed ? "settled via webhook" : "already settled"} (${paymentId})`);
      }
    }

    if (eventType === "payment.failed") {
      // Cancel the booking on explicit payment failure (FAILED ≠ REFUNDED).
      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
          syncedAt: new Date(),
        },
      });
      console.log(`[/api/webhooks/razorpay] Booking ${bookingId} CANCELLED due to failed payment (${paymentId})`);
    }

    if (eventType === "payment.refunded") {
      await db.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "REFUNDED" },
      });
      console.log(`[/api/webhooks/razorpay] Booking ${bookingId} REFUNDED (${paymentId})`);
    }

    return NextResponse.json({ ok: true, event: eventType });
  } catch (e: unknown) {
    console.error("[/api/webhooks/razorpay] error:", e);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

