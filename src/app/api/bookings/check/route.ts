import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
});

/**
 * POST /api/bookings/check
 * Body: { roomId, checkIn (ISO), checkOut (ISO) }
 * Returns:
 *   - available: boolean
 *   - roomsLeft: number
 *   - pricePerNight, nights, subtotal, taxes, serviceFee, total
 *   - appliedRateOverride (if any festival/seasonal surge)
 *
 * Inventory model: each Room has `totalCount` inventory. We count overlapping
 * CONFIRMED bookings (status != CANCELLED) for the date range and subtract.
 * This is a single-source-of-truth check — concurrent bookings use a
 * transactional write in /api/bookings to prevent double-booking.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const checkIn = new Date(parsed.data.checkIn);
    const checkOut = new Date(parsed.data.checkOut);

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    const nights = Math.max(
      1,
      Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );

    const room = await db.room.findUnique({
      where: { id: parsed.data.roomId },
      include: { rateOverrides: true },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    // Count overlapping confirmed bookings
    const overlapping = await db.booking.count({
      where: {
        roomId: room.id,
        status: { not: "CANCELLED" },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });

    const roomsLeft = Math.max(0, room.totalCount - overlapping);
    const available = roomsLeft > 0;

    // Resolve rate — pick the highest applicable override in the window
    const applicableOverrides = room.rateOverrides.filter((ro) => {
      const roStart = new Date(ro.startDate);
      const roEnd = new Date(ro.endDate);
      return roStart < checkOut && roEnd > checkIn;
    });
    const surgeOverride = applicableOverrides.length
      ? applicableOverrides.reduce((max, ro) => (ro.pricePerNight > max.pricePerNight ? ro : max))
      : null;
    const pricePerNight = surgeOverride ? surgeOverride.pricePerNight : room.basePrice;

    const subtotal = pricePerNight * nights;
    const taxesGst = Math.round(subtotal * 0.12); // 12% GST
    const serviceFee = 250 * nights;
    const totalAmount = subtotal + taxesGst + serviceFee;

    return NextResponse.json({
      available,
      roomsLeft,
      nights,
      pricePerNight,
      subtotal,
      taxesGst,
      serviceFee,
      totalAmount,
      appliedRateOverride: surgeOverride ? surgeOverride.name : null,
      room: {
        id: room.id,
        name: room.name,
        totalCount: room.totalCount,
      },
    });
  } catch (e) {
    console.error("[/api/bookings/check] error:", e);
    return NextResponse.json({ error: "Availability check failed." }, { status: 500 });
  }
}
