import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/availability?roomId=...&startDate=...&endDate=...
 *
 * Returns:
 *   availability: { "YYYY-MM-DD": bookedCount } — rooms booked each night
 *   closed:       { "YYYY-MM-DD": true }       — days the admin closed sales
 *   overrides:    { "YYYY-MM-DD": n }           — admin sellable overrides
 *
 * Used by the AvailabilityCalendar component on the room detail page;
 * effective rooms-left = (closed ? 0 : override ?? totalCount) − booked.
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
    const [bookings, inventoryDays, room] = await Promise.all([
      db.booking.findMany({
        where: {
          roomId,
          status: { not: "CANCELLED" },
          AND: [
            { checkIn: { lt: endDate } },
            { checkOut: { gt: startDate } },
          ],
        },
        select: { checkIn: true, checkOut: true },
      }),
      db.roomInventoryDay.findMany({
        where: {
          roomId,
          date: { gte: startDate, lt: endDate },
        },
        select: { date: true, isClosed: true, sellableOverride: true },
      }),
      db.room.findUnique({ where: { id: roomId }, select: { totalCount: true } }),
    ]);

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

    // Admin per-day inventory control
    const closed: Record<string, boolean> = {};
    const overrides: Record<string, number> = {};
    for (const row of inventoryDays) {
      const key = row.date.toISOString().slice(0, 10);
      if (row.isClosed) closed[key] = true;
      if (row.sellableOverride !== null && row.sellableOverride !== undefined) {
        overrides[key] = row.sellableOverride;
      }
    }
    void room; // totalCount is passed to the calendar client-side (unchanged)

    return NextResponse.json({ availability, closed, overrides });
  } catch (e) {
    console.error("[/api/rooms/availability] error:", e);
    return NextResponse.json({ availability: {}, closed: {}, overrides: {}, error: "Failed" }, { status: 500 });
  }
}
