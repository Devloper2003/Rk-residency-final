import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Returns dashboard KPIs:
 *   - totalBookings, confirmedBookings, cancelledBookings
 *   - totalRevenue (sum of totalAmount where paymentStatus=PAID or PAY_AT_HOTEL pending)
 *   - occupancyPct (booked room-nights / total available room-nights for next 30 days)
 *   - adr (average daily rate = revenue / booked room-nights)
 *   - revpar (revenue per available room = revenue / total available room-nights)
 *   - arrivalsToday, departuresToday
 *   - revenueTrend (last 7 days)
 *   - roomTypeStats (bookings + revenue per room)
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allBookings = await db.booking.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { room: true },
    });

    const totalBookings = allBookings.length;
    const cancelledBookings = await db.booking.count({ where: { status: "CANCELLED" } });

    // Revenue = sum of totalAmount for non-cancelled bookings
    const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Booked room-nights = sum of nights
    const bookedRoomNights = allBookings.reduce((sum, b) => sum + b.nights, 0);

    // Total available room-nights for next 30 days
    const totalRooms = await db.room.aggregate({ _sum: { totalCount: true } });
    const totalRoomInventory = totalRooms._sum.totalCount || 0;
    const availableRoomNights30d = totalRoomInventory * 30;

    // Occupancy over the next 30 days
    const bookedRoomNights30d = allBookings
      .filter((b) => {
        const checkOut = new Date(b.checkOut);
        return checkOut > now && b.checkIn < next30;
      })
      .reduce((sum, b) => {
        // Clip to next 30 days
        const start = new Date(Math.max(b.checkIn.getTime(), now.getTime()));
        const end = new Date(Math.min(b.checkOut.getTime(), next30.getTime()));
        const nights = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        return sum + nights;
      }, 0);
    const occupancyPct = availableRoomNights30d > 0
      ? Math.round((bookedRoomNights30d / availableRoomNights30d) * 100)
      : 0;

    const adr = bookedRoomNights > 0 ? Math.round(totalRevenue / bookedRoomNights) : 0;
    const revpar = availableRoomNights30d > 0 ? Math.round(totalRevenue / availableRoomNights30d) : 0;

    // Arrivals/departures today
    const arrivalsToday = await db.booking.count({
      where: {
        checkIn: { gte: startOfToday, lt: endOfToday },
        status: { not: "CANCELLED" },
      },
    });
    const departuresToday = await db.booking.count({
      where: {
        checkOut: { gte: startOfToday, lt: endOfToday },
        status: { not: "CANCELLED" },
      },
    });

    // Revenue trend (last 7 days)
    const trend: Array<{ date: string; label: string; revenue: number; bookings: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayBookings = allBookings.filter((b) => {
        return b.createdAt >= dayStart && b.createdAt < dayEnd;
      });
      const dayRevenue = dayBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      trend.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: dayRevenue,
        bookings: dayBookings.length,
      });
    }

    // Per-room stats
    const rooms = await db.room.findMany();
    const roomTypeStats = rooms.map((r) => {
      const roomBookings = allBookings.filter((b) => b.roomId === r.id);
      return {
        roomId: r.id,
        roomName: r.name,
        bookings: roomBookings.length,
        revenue: roomBookings.reduce((sum, b) => sum + b.totalAmount, 0),
        nights: roomBookings.reduce((sum, b) => sum + b.nights, 0),
        occupancy: totalRoomInventory > 0
          ? Math.round((roomBookings.reduce((s, b) => s + b.nights, 0) / (r.totalCount * 30)) * 100)
          : 0,
      };
    });

    return NextResponse.json({
      totalBookings,
      cancelledBookings,
      totalRevenue,
      occupancyPct,
      adr,
      revpar,
      arrivalsToday,
      departuresToday,
      totalRooms: totalRoomInventory,
      revenueTrend: trend,
      roomTypeStats,
    });
  } catch (e) {
    console.error("[/api/admin/stats] error:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
