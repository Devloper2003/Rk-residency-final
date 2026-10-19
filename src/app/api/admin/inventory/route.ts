import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inventory
 * Query: roomId, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 *
 * Returns: { overrides: RoomInventoryDay[], bookedMap: Record<string,number>, room }
 *
 * Uses RoomInventoryDay model from Prisma schema.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    if (!roomId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing roomId, startDate, or endDate" }, { status: 400 });
    }

    const startDate = new Date(startDateStr + "T00:00:00Z");
    const endDate = new Date(endDateStr + "T23:59:59Z");

    // Fetch room info
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, totalCount: true },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Fetch inventory overrides in the date range (using RoomInventoryDay)
    const overridesRaw = await db.roomInventoryDay.findMany({
      where: {
        roomId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    // Map to the format the frontend expects: { id, date (YYYY-MM-DD string), availableCount, note }
    const overrides = overridesRaw.map((o) => ({
      id: o.id,
      date: o.date.toISOString().slice(0, 10),
      availableCount: o.sellableOverride ?? 0,
      note: o.note,
    }));

    // Fetch non-cancelled bookings overlapping the range
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

    // Build per-date booked count map
    const bookedMap: Record<string, number> = {};
    for (const b of bookings) {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      const current = new Date(ci);
      while (current < co) {
        const ds = current.toISOString().slice(0, 10);
        bookedMap[ds] = (bookedMap[ds] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({
      room,
      overrides,
      bookedMap,
    });
  } catch (e) {
    console.error("[/api/admin/inventory GET] error:", e);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

/* ── POST: Create or update a day-wise inventory override ── */
const upsertSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableCount: z.number().int().min(0).max(50),
  note: z.string().max(200).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { roomId, date, availableCount, note } = parsed.data;
    const dateObj = new Date(date + "T00:00:00Z");

    // Upsert using RoomInventoryDay model
    const override = await db.roomInventoryDay.upsert({
      where: { roomId_date: { roomId, date: dateObj } },
      create: {
        roomId,
        date: dateObj,
        isClosed: availableCount === 0,
        sellableOverride: availableCount,
        note: note || null,
      },
      update: {
        isClosed: availableCount === 0,
        sellableOverride: availableCount,
        note: note || null,
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "INVENTORY_OVERRIDE_SET",
        entity: "RoomInventoryDay",
        entityId: override.id,
        details: `Room ${roomId} on ${date}: set availableCount=${availableCount}${note ? ` (${note})` : ""}`,
      },
    });

    return NextResponse.json({
      ok: true,
      override: {
        id: override.id,
        date,
        availableCount,
        note: note || null,
      },
    });
  } catch (e) {
    console.error("[/api/admin/inventory POST] error:", e);
    return NextResponse.json({ error: "Failed to set inventory override" }, { status: 500 });
  }
}

/* ── DELETE: Remove a day-wise override (revert to default totalCount) ── */
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Override id required" }, { status: 400 });

    await db.roomInventoryDay.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "INVENTORY_OVERRIDE_REMOVED",
        entity: "RoomInventoryDay",
        entityId: id,
        details: `Removed inventory override ${id} (reverted to default)`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/inventory DELETE] error:", e);
    return NextResponse.json({ error: "Failed to remove override" }, { status: 500 });
  }
}
