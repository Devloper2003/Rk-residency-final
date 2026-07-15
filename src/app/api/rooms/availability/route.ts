import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/availability?roomId=...&startDate=...&endDate=...
 *
 * Returns a map of { "YYYY-MM-DD": bookedCount } for each date in the range
 * that has at least one overlapping booking.
 *
 * Used by the AvailabilityCalendar component on the room detail page.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    if (!roomId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Find all non-cancelled bookings that overlap the date range
    const bookings = await db.booking.findMany({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        AND: [
          { checkIn: { lt: endDate } },
          { checkOut: { gt: startDate } },
        ],
      },
      select: { checkIn: true, checkOut: true },
    });

    // Build a map of date -> booked count
    const availability: Record<string, number> = {};
    for (const b of bookings) {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      // Iterate each night from checkIn to checkOut (exclusive)
      const current = new Date(checkIn);
      while (current < checkOut) {
        const dateStr = current.toISOString().slice(0, 10);
        availability[dateStr] = (availability[dateStr] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({ availability });
  } catch (e) {
    console.error("[/api/rooms/availability] error:", e);
    return NextResponse.json({ availability: {}, error: "Failed" }, { status: 500 });
  }
}
