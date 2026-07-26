import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Helper: read a SiteSetting value from the database.
 * Falls back to empty string if not found.
 */
async function getSetting(key: string): Promise<string> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? "";
}

/**
 * POST /api/razorpay/order
 *
 * Creates a Razorpay order for an existing booking.
 * Body: { bookingId: string }
 *
 * Returns: { orderId, amount, currency, keyId, bookingId, guestName, guestEmail, guestPhone }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body as { bookingId?: string };

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
    }

    // 1. Fetch the booking from DB
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking already paid." }, { status: 400 });
    }

    // 2. Read Razorpay keys from SiteSetting (admin-managed, NOT .env)
    const keyId = await getSetting("razorpay_key_id");
    const keySecret = await getSetting("razorpay_key_secret");
    const enabled = await getSetting("razorpay_enabled");

    if (enabled !== "true" || !keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Please contact the hotel or pay at arrival." },
        { status: 503 }
      );
    }

    // 3. Create Razorpay order
    // Razorpay expects amount in paise (₹1 = 100 paise)
    const amountInPaise = booking.totalAmount * 100;

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: booking.referenceCode,
      notes: {
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        roomName: booking.room.name,
        guestName: booking.guestName,
      },
    });

    // 4. Return order details to frontend
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId,
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      referenceCode: booking.referenceCode,
      roomName: booking.room.name,
    });
  } catch (e: unknown) {
    console.error("[/api/razorpay/order] error:", e);
    const msg = e instanceof Error ? e.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

