import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { checkRangeAvailability } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Booking Engine API — front-desk availability search.
 *
 * GET /api/admin/booking-engine?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *   → per room type: live sellable rooms left for the WHOLE range (min across
 *     nights, honouring Inventory open/close control), base price, GST-inclusive
 *     totals for the requested nights. Same availability engine as the public
 *     website booking widget (checkRangeAvailability), so the front desk and
 *     the website can never oversell.
 *
 * Zero schema change — reads Rooms + Bookings + RoomInventoryDay only.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const checkInStr = url.searchParams.get("checkIn");
    const checkOutStr = url.searchParams.get("checkOut");

    // Default stay: today → tomorrow. The client always sends explicit dates;
    // the fallback just makes bare calls useful.
    const todayKey = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const checkIn = checkInStr ? new Date(`${checkInStr}T00:00:00.000Z`) : new Date(`${todayKey}T00:00:00.000Z`);
    const checkOut = checkOutStr ? new Date(`${checkOutStr}T00:00:00.000Z`) : new Date(`${tomorrow.toISOString().slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: "Invalid dates — use YYYY-MM-DD" }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);

    const rooms = await db.room.findMany({
      orderBy: { basePrice: "asc" },
      select: { id: true, name: true, basePrice: true, maxGuests: true, totalCount: true, view: true, sizeSqft: true, bedType: true },
    });

    // Live availability per room type for the whole range (min across nights)
    const results = await Promise.all(
      rooms.map(async (room) => {
        const range = await checkRangeAvailability(room.id, room.totalCount, checkIn, checkOut);
        const subtotal = room.basePrice * nights;
        const taxesGst = Math.round(subtotal * 0.05);
        return {
          roomId: room.id,
          name: room.name,
          basePrice: room.basePrice,
          maxGuests: room.maxGuests,
          totalCount: room.totalCount,
          view: room.view,
          sizeSqft: room.sizeSqft,
          bedType: room.bedType,
          roomsLeft: range.minRoomsLeft,
          closed: range.closedDates.length > 0,
          closedDates: range.closedDates,
          nights,
          subtotal,
          taxesGst,
          total: subtotal + taxesGst,
        };
      })
    );

    return NextResponse.json({ checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), nights, rooms: results });
  } catch (e) {
    console.error("[/api/admin/booking-engine GET] error:", e);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
