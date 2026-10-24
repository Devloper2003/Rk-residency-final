import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { payableNow } from "@/lib/payment-modes";
import { applyCapturedPayment, notifyOwnerWhatsApp, bookingWhatsAppText } from "@/lib/booking-sync";

export const dynamic = "force-dynamic";

/**
 * Helper: read a SiteSetting value from the database.
 */
async function getSetting(key: string): Promise<string> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? "";
}

/**
 * POST /api/razorpay/verify
 *
 * Verifies the Razorpay payment signature from the frontend callback.
 * If signature is valid → marks the booking per its payment mode and stores paymentRef:
 *   PREPAID (or legacy online) → PAID, paidAmount = total
 *   PARTIAL_PAID               → PARTIAL, paidAmount = 20% advance
 *
 * Body: {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string,
 *   bookingId: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      bookingId?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Get the secret from DB
    const keySecret = await getSetting("razorpay_key_secret");
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay not configured." }, { status: 503 });
    }

    // 2. Generate the expected signature
    // Razorpay docs: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 3. Compare signatures (length-safe, timing-safe comparison —
    // crypto.timingSafeEqual THROWS on length mismatch, which used to surface
    // as a 500 for garbage signatures)
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(razorpay_signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // 4. Update the booking in DB — mode-aware (advance vs full collection).
    // applyCapturedPayment is idempotent (webhook + verify can race) and
    // notifies the owner's WhatsApp when money actually lands.
    const existing = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // 5. CRITICAL binding check: the Razorpay order presented in this callback
    // must be the order that was created FOR THIS booking (the checkout session
    // stores it on the row). Without this, a valid signature from a cheap
    // ₹500 payment could mark a ₹50,000 booking as paid. Legacy rows predating
    // the razorpayOrderId column (null) are allowed through and backfilled.
    if (existing.razorpayOrderId && existing.razorpayOrderId !== razorpay_order_id) {
      console.error(
        `[/api/razorpay/verify] ORDER MISMATCH booking=${existing.referenceCode} ` +
        `expected=${existing.razorpayOrderId} got=${razorpay_order_id}`
      );
      return NextResponse.json({ error: "Payment does not belong to this booking." }, { status: 400 });
    }
    if (!existing.razorpayOrderId) {
      await db.booking.update({
        where: { id: bookingId },
        data: { razorpayOrderId: razorpay_order_id },
      });
    }
    const collected = payableNow(existing.paymentMethod || "PREPAID", existing.totalAmount);
    const changed = await applyCapturedPayment(bookingId, razorpay_payment_id);
    const booking = await db.booking.findUnique({ where: { id: bookingId } });

    if (changed) {
      await notifyOwnerWhatsApp(
        bookingWhatsAppText(
          { ...existing, paidAmount: collected, paymentStatus: existing.paymentMethod === "PARTIAL_PAID" ? "PARTIAL" : "PAID" },
          existing.room?.name || "",
          "PAID"
        )
      );
    }

    return NextResponse.json({
      ok: true,
      paymentStatus: booking?.paymentStatus,
      paymentRef: booking?.paymentRef,
      referenceCode: booking?.referenceCode,
    });
  } catch (e: unknown) {
    console.error("[/api/razorpay/verify] error:", e);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}

