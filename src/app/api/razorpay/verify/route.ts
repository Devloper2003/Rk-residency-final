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
 * POST /api/razorpay/verify
 *
 * Verifies the Razorpay payment signature from the frontend callback.
 * If signature is valid → marks booking as PAID and stores paymentRef.
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

    // 3. Compare signatures (timing-safe comparison)
    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature))) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // 4. Update the booking in DB
    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        paymentRef: razorpay_payment_id,
      },
    });

    return NextResponse.json({
      ok: true,
      paymentStatus: booking.paymentStatus,
      paymentRef: booking.paymentRef,
      referenceCode: booking.referenceCode,
    });
  } catch (e: unknown) {
    console.error("[/api/razorpay/verify] error:", e);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}

