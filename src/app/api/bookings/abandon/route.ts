import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { notifyOwnerWhatsApp } from "@/lib/booking-sync";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/abandon
 * Body: { bookingId }
 *
 * Called by the booking widget the instant the guest closes the Razorpay
 * checkout modal without paying (modal.ondismiss). Owner preference: unpaid
 * online bookings are cancelled IMMEDIATELY and inventory is released right
 * away, instead of waiting for the pending-window sweep.
 *
 * Safety rails:
 *   - Only CONFIRMED + PENDING + zero-collected online bookings
 *     (PREPAID / PARTIAL_PAID) can ever be abandoned. PAID, PARTIAL,
 *     PAY_AT_HOTEL, checked-in and already-cancelled rows are untouched —
 *     the endpoint is a no-op for them, so it cannot be abused to kill a
 *     paying guest's stay.
 *   - Idempotent: repeated calls return ok without side effects.
 *   - If a payment actually captured a moment later (guest was mid-transaction),
 *     webhook/verify re-activates the booking when the slot is still free, or
 *     alerts the owner to refund — see applyCapturedPayment in booking-sync.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`abandon:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const bookingId = (body as { bookingId?: string }).bookingId;
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required." }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { name: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const abandonable =
      booking.status === "CONFIRMED" &&
      booking.paymentStatus === "PENDING" &&
      (booking.paymentMethod === "PREPAID" || booking.paymentMethod === "PARTIAL_PAID") &&
      booking.paidAmount === 0;

    if (!abandonable) {
      // Paid / hotel-pay / already handled — nothing to cancel.
      return NextResponse.json({ ok: true, cancelled: false });
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", paymentStatus: "FAILED", syncedAt: new Date() },
    });
    console.log(`[booking-abandon] ${booking.referenceCode} cancelled on checkout dismiss (immediate)`);

    await notifyOwnerWhatsApp(
      `*BOOKING CANCELLED — RK Residency*\n` +
      `Ref: ${booking.referenceCode}\n` +
      `Guest: ${booking.guestName} (${booking.guestPhone})\n` +
      `Room: ${booking.room?.name || "-"}\n` +
      `Reason: guest closed the payment window without paying. Cancelled immediately, inventory released.`
    );

    return NextResponse.json({ ok: true, cancelled: true });
  } catch (e: unknown) {
    console.error("[/api/bookings/abandon] error:", e);
    return NextResponse.json({ error: "Abandon failed." }, { status: 500 });
  }
}
