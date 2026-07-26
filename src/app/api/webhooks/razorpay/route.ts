import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

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
      // Mark booking as PAID (idempotent — safe if already PAID)
      await db.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          paymentRef: paymentId,
          paymentMethod: "RAZORPAY",
        },
      });
      console.log(`[/api/webhooks/razorpay] Booking ${bookingId} marked PAID via webhook (${paymentId})`);
    }

    if (eventType === "payment.failed") {
      // Cancel the booking on payment failure
      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
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
