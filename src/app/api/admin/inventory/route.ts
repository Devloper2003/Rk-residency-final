import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { bookedPerNight, effectiveSellable } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Admin per-day inventory control (Phase 4).
 *
 * GET  /api/admin/inventory?startDate=YYYY-MM-DD&days=14
 *   → grid for the Inventory tab: per room, per day:
 *     { booked, closed, override, sellable } where
 *     sellable = effective sellable count that day (0 when closed).
 *
 * POST /api/admin/inventory
 *   body: { roomId, date: "YYYY-MM-DD",
 *           isClosed?: boolean,
 *           sellableOverride?: number | null,
 *           note?: string,
 *           reset?: boolean }   ← deletes the row (fully default behaviour)
 *   → upserts the RoomInventoryDay row and returns it.
 *
 * Every call is audit-logged. No other data is touched.
 */

const MAX_DAYS = 31;

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const startDateStr = url.searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const days = Math.min(MAX_DAYS, Math.max(1, parseInt(url.searchParams.get("days") || "14", 10) || 14));

    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    const keys = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const rangeEnd = new Date(start);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + days);

    const [rooms, bookings, inventoryDays] = await Promise.all([
      db.room.findMany({ orderBy: [{ sortOrder: "asc" }], select: { id: true, name: true, slug: true, totalCount: true, badge: true } }),
      db.booking.findMany({
        where: { status: { not: "CANCELLED" }, checkIn: { lt: rangeEnd }, checkOut: { gt: start } },
        select: { roomId: true, checkIn: true, checkOut: true },
      }),
      db.roomInventoryDay.findMany({
        where: { date: { gte: start, lt: rangeEnd } },
        select: { roomId: true, date: true, isClosed: true, sellableOverride: true, note: true },
      }),
    ]);

    // Per-room booked counts per night
    const bookedByRoom: Record<string, Record<string, number>> = {};
    for (const room of rooms) {
      bookedByRoom[room.id] = bookedPerNight(
        bookings.filter((b) => b.roomId === room.id).map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut })),
        keys
      );
    }

    // Per-room inventory-day control rows
    const controlByRoom: Record<string, Record<string, { isClosed: boolean; sellableOverride: number | null; note: string | null }>> = {};
    for (const row of inventoryDays) {
      const key = row.date.toISOString().slice(0, 10);
      controlByRoom[row.roomId] = controlByRoom[row.roomId] || {};
      controlByRoom[row.roomId][key] = {
        isClosed: row.isClosed,
        sellableOverride: row.sellableOverride,
        note: row.note,
      };
    }

    const grid = rooms.map((room) => {
      const daysMap: Record<string, { booked: number; closed: boolean; override: number | null; sellable: number; note: string | null }> = {};
      for (const key of keys) {
        const control = controlByRoom[room.id]?.[key];
        const sellable = effectiveSellable(room.totalCount, control);
        daysMap[key] = {
          booked: bookedByRoom[room.id][key] || 0,
          closed: control?.isClosed ?? false,
          override: control?.sellableOverride ?? null,
          sellable,
          note: control?.note ?? null,
        };
      }
      return { id: room.id, name: room.name, slug: room.slug, totalCount: room.totalCount, badge: room.badge, days: daysMap };
    });

    return NextResponse.json({ startDate: startDateStr, days, keys, rooms: grid });
  } catch (e) {
    console.error("[/api/admin/inventory GET] error:", e);
    return NextResponse.json({ error: "Failed to load inventory grid" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { roomId, date, isClosed, sellableOverride, note, reset } = body as {
      roomId?: string; date?: string; isClosed?: boolean;
      sellableOverride?: number | null; note?: string; reset?: boolean;
    };

    if (!roomId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "roomId and date (YYYY-MM-DD) are required" }, { status: 400 });
    }
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const dayDate = new Date(`${date}T00:00:00.000Z`);

    // Reset → back to fully default behaviour (delete the control row)
    if (reset) {
      await db.roomInventoryDay.deleteMany({ where: { roomId, date: dayDate } });
      await db.auditLog.create({
        data: { adminId: admin.id, action: "INVENTORY_DAY_RESET", entity: "RoomInventoryDay", entityId: `${roomId}:${date}`, details: `Reset inventory control for ${room.name} on ${date}` },
      });
      return NextResponse.json({ ok: true, reset: true, roomId, date });
    }

    if (typeof isClosed !== "boolean" && sellableOverride === undefined) {
      return NextResponse.json({ error: "Nothing to change: pass isClosed and/or sellableOverride" }, { status: 400 });
    }
    if (sellableOverride !== undefined && sellableOverride !== null && (!Number.isInteger(sellableOverride) || sellableOverride < 0)) {
      return NextResponse.json({ error: "sellableOverride must be a non-negative integer or null" }, { status: 400 });
    }

    const existing = await db.roomInventoryDay.findUnique({ where: { roomId_date: { roomId, date: dayDate } } });
    const row = await db.roomInventoryDay.upsert({
      where: { roomId_date: { roomId, date: dayDate } },
      create: {
        roomId,
        date: dayDate,
        isClosed: isClosed ?? false,
        sellableOverride: sellableOverride ?? null,
        note: note ?? null,
      },
      update: {
        ...(typeof isClosed === "boolean" ? { isClosed } : {}),
        ...(sellableOverride !== undefined ? { sellableOverride } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "INVENTORY_DAY_SET",
        entity: "RoomInventoryDay",
        entityId: `${roomId}:${date}`,
        details: `${room.name} on ${date}: ${row.isClosed ? "CLOSED" : `open, sellable ${row.sellableOverride ?? room.totalCount}`}${existing ? " (updated)" : ""}`,
      },
    });

    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[/api/admin/inventory POST] error:", e);
    return NextResponse.json({ error: "Failed to update inventory day" }, { status: 500 });
  }
}
