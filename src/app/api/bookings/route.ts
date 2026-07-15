import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  nights: z.number().int().min(1).max(30),
  adults: z.number().int().min(1).max(12),
  children: z.number().int().min(0).max(8),
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email().max(160),
  guestPhone: z.string().min(6).max(30),
  specialRequests: z.string().max(2000).optional().or(z.literal("")),
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "PAY_AT_HOTEL"]).default("PAY_AT_HOTEL"),
});

function generateReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RK-VRD-${year}-${rand}`;
}

/**
 * POST /api/bookings
 * Creates a booking using a Prisma transaction to prevent double-booking.
 *
 * Inventory check + write happens inside the same tx:
 *   1. Lock-equivalent: count overlapping CONFIRMED bookings
 *   2. If roomsLeft > 0, create the booking
 *   3. Otherwise return 409 Conflict
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking request.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      roomId, checkIn: checkInISO, checkOut: checkOutISO, nights,
      adults, children, guestName, guestEmail, guestPhone,
      specialRequests, paymentMethod,
    } = parsed.data;

    const checkIn = new Date(checkInISO);
    const checkOut = new Date(checkOutISO);
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    // Run the whole flow inside a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Fetch room with overrides
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { rateOverrides: true },
      });
      if (!room) throw new Error("ROOM_NOT_FOUND");

      // 2. Inventory check inside tx
      const overlapping = await tx.booking.count({
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
      if (roomsLeft <= 0) {
        throw new Error("SOLD_OUT");
      }

      // 3. Resolve price (surge override if applicable)
      const applicable = room.rateOverrides.filter((ro) => {
        const roStart = new Date(ro.startDate);
        const roEnd = new Date(ro.endDate);
        return roStart < checkOut && roEnd > checkIn;
      });
      const surge = applicable.length
        ? applicable.reduce((max, ro) => (ro.pricePerNight > max.pricePerNight ? ro : max))
        : null;
      const pricePerNight = surge ? surge.pricePerNight : room.basePrice;

      const subtotal = pricePerNight * nights;
      const taxesGst = Math.round(subtotal * 0.12);
      const serviceFee = 250 * nights;
      const totalAmount = subtotal + taxesGst + serviceFee;

      // 4. Upsert guest
      const guest = await tx.guest.upsert({
        where: { email: guestEmail.toLowerCase() },
        create: {
          fullName: guestName,
          email: guestEmail.toLowerCase(),
          phone: guestPhone,
        },
        update: {
          fullName: guestName,
          phone: guestPhone,
        },
      });

      // 5. Generate unique reference code (retry if collision)
      let referenceCode = generateReference();
      const exists = await tx.booking.findUnique({ where: { referenceCode } });
      if (exists) {
        referenceCode = generateReference();
      }

      // 6. Create the booking
      const booking = await tx.booking.create({
        data: {
          referenceCode,
          roomId: room.id,
          guestId: guest.id,
          checkIn,
          checkOut,
          nights,
          adults,
          children,
          guestName,
          guestEmail: guestEmail.toLowerCase(),
          guestPhone,
          specialRequests: specialRequests || null,
          pricePerNight,
          subtotal,
          taxesGst,
          serviceFee,
          totalAmount,
          status: "CONFIRMED",
          paymentStatus: paymentMethod === "PAY_AT_HOTEL" ? "PENDING" : "PENDING",
          paymentMethod,
        },
      });

      return { booking, room };
    });

    return NextResponse.json({
      ok: true,
      referenceCode: result.booking.referenceCode,
      bookingId: result.booking.id,
      roomName: result.room.name,
      checkIn: result.booking.checkIn,
      checkOut: result.booking.checkOut,
      nights: result.booking.nights,
      totalAmount: result.booking.totalAmount,
      paymentStatus: result.booking.paymentStatus,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Booking failed";
    if (msg === "SOLD_OUT") {
      return NextResponse.json(
        { error: "Sorry — this room just sold out for those dates. Please pick another room or dates." },
        { status: 409 }
      );
    }
    if (msg === "ROOM_NOT_FOUND") {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    console.error("[/api/bookings] error:", e);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
