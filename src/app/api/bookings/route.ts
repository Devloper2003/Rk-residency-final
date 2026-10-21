import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkRangeAvailability } from "@/lib/inventory";

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
  planId: z.string().max(64).optional().or(z.literal("")), // OTA rate plan (null = classic base price)
  specialRequests: z.string().max(2000).optional().or(z.literal("")),
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "PAY_AT_HOTEL"]).default("PAY_AT_HOTEL"),
    discountCode: z.string().max(30).optional().or(z.literal("")),
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
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`booking:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many booking attempts. Please wait." }, { status: 429 });
  }
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
      adults, children, guestName, guestEmail, guestPhone, planId,
            specialRequests, paymentMethod, discountCode: rawDiscountCode,
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

      // 2. Inventory check inside tx — per night, honouring admin open/close
      const range = await checkRangeAvailability(room.id, room.totalCount, checkIn, checkOut, tx);
      if (!range.available) {
        if (range.closedDates.length > 0) {
          throw new Error(`SOLD_OUT:${range.closedDates.join(",")}`);
        }
        throw new Error("SOLD_OUT");
      }

      // 3. Resolve price — chosen rate plan first (with day-wise overrides),
      // else the classic surge-override / base price path.
      let pricePerNight: number;
      let subtotal: number;
      let planIdValue: string | null = null;
      let planNameValue: string | null = null;

      const chosenPlanId = planId && planId.trim() ? planId.trim() : null;
      if (chosenPlanId) {
        const plan = await tx.ratePlan.findUnique({
          where: { id: chosenPlanId },
          select: { id: true, code: true, name: true, pricePerNight: true, isActive: true, roomId: true },
        });
        if (!plan || !plan.isActive || plan.roomId !== room.id) throw new Error("PLAN_INVALID");

        const dayRates = await tx.planDayRate.findMany({
          where: { planId: plan.id, date: { gte: checkIn, lt: checkOut } },
          select: { date: true, price: true },
        });
        const overrideMap = new Map<string, number>();
        for (const o of dayRates) {
          overrideMap.set(o.date.toISOString().slice(0, 10), o.price);
        }

        subtotal = 0;
        let counted = 0;
        const cur = new Date(checkIn);
        cur.setUTCHours(0, 0, 0, 0);
        const end = new Date(checkOut);
        end.setUTCHours(0, 0, 0, 0);
        while (cur < end) {
          const key = cur.toISOString().slice(0, 10);
          const p = overrideMap.get(key);
          subtotal += p !== undefined && p > 0 ? p : plan.pricePerNight;
          counted++;
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
        if (counted !== nights) throw new Error("NIGHTS_MISMATCH");
        pricePerNight = Math.round(subtotal / nights);
        planIdValue = plan.id;
        planNameValue = `${plan.code} — ${plan.name}`;
      } else {
        const applicable = room.rateOverrides.filter((ro) => {
          const roStart = new Date(ro.startDate);
          const roEnd = new Date(ro.endDate);
          return roStart < checkOut && roEnd > checkIn;
        });
        const surge = applicable.length
          ? applicable.reduce((max, ro) => (ro.pricePerNight > max.pricePerNight ? ro : max))
          : null;
        pricePerNight = surge ? surge.pricePerNight : room.basePrice;
        subtotal = pricePerNight * nights;
      }

            // Validate discount code if provided
      let discountPct = 0;
      let discountRecordId: string | undefined;
      if (rawDiscountCode && rawDiscountCode.trim()) {
        const now = new Date();
        const coupon = await tx.discountCode.findUnique({
          where: { code: rawDiscountCode.toUpperCase().trim() },
        });
        if (
          coupon &&
          coupon.isActive &&
          !coupon.usedAt &&
          now >= coupon.validFrom &&
          now <= coupon.validUntil &&
          coupon.createdByGuest.toLowerCase() === guestEmail.toLowerCase()
        ) {
          discountPct = coupon.discountPct;
          discountRecordId = coupon.id;
        }
      }

      const discountAmount = Math.round(subtotal * (discountPct / 100));
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxesGst = Math.round(subtotalAfterDiscount * 0.05);
      // No service fee — the published price story everywhere on the site is
      // "room/plan rate + a single 5% GST at checkout, no hidden charges".
      const serviceFee = 0;
      const totalAmount = subtotalAfterDiscount + taxesGst + serviceFee;

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

      // 5. Generate unique reference code (loop until unique)
      let referenceCode = generateReference();
      while (await tx.booking.findUnique({ where: { referenceCode } })) {
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
          planId: planIdValue,
          planName: planNameValue,
          specialRequests: specialRequests || null,
          pricePerNight,
          subtotal: subtotalAfterDiscount,
          taxesGst,
          serviceFee,
          totalAmount,
          status: "CONFIRMED",
          // Always PENDING for prepaid methods.
          // Razorpay/Stripe verification or webhook will flip this to PAID.
          paymentStatus: "PENDING",
          paymentMethod,
        },
      });

           // Mark coupon as used
      if (discountRecordId) {
        await tx.discountCode.update({
          where: { id: discountRecordId },
          data: { usedByBooking: booking.id, usedAt: new Date() },
        });
      }

      return { booking, room, discountPct, discountAmount };
    });

    // Send confirmation email (non-blocking — booking succeeds even if email fails)
    fetch(`${new URL(req.url).origin}/api/booking-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: result.booking.id }),
    }).catch(() => {});

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
    if (msg === "SOLD_OUT" || msg.startsWith("SOLD_OUT:")) {
      const closed = msg.startsWith("SOLD_OUT:") ? msg.slice("SOLD_OUT:".length) : "";
      return NextResponse.json(
        {
          error: closed
            ? `Sorry — the hotel is not accepting bookings for ${closed.split(",").join(", ")}. Please pick different dates.`
            : "Sorry — this room just sold out for those dates. Please pick another room or dates.",
        },
        { status: 409 }
      );
    }
    if (msg === "ROOM_NOT_FOUND") {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    if (msg === "PLAN_INVALID") {
      return NextResponse.json({ error: "The selected rate plan is no longer available. Please pick another plan." }, { status: 400 });
    }
    if (msg === "NIGHTS_MISMATCH") {
      return NextResponse.json({ error: "Date mismatch. Please re-select your dates." }, { status: 400 });
    }
    console.error("[/api/bookings] error:", e);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}

