import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_GRID_DAYS = 60; // grid view window cap
const MAX_RANGE_DAYS = 180; // bulk range cap

const DAY_MS = 86_400_000;

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of "YYYY-MM-DD" keys from..to. */
function dayRange(fromStr: string, toStr: string): string[] {
  const out: string[] = [];
  const from = new Date(`${fromStr}T00:00:00.000Z`);
  const to = new Date(`${toStr}T00:00:00.000Z`);
  for (let d = new Date(from); d <= to && out.length < MAX_RANGE_DAYS + 1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * GET /api/admin/inventory — supports two shapes (additive):
 *
 * 1) Single-room shape (Room Inventory modal):
 *    ?roomId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *    → { room, overrides: [{id, date, availableCount, isClosed, note}], bookedMap }
 *
 * 2) All-rooms grid shape (Open/Close inventory by day grid):
 *    ?startDate=YYYY-MM-DD&days=14   (or endDate=YYYY-MM-DD)
 *    → { startDate, days, keys, rooms: [{id, name, slug, totalCount, badge,
 *          days: { [date]: { booked, closed, override, sellable, note } } }] }
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    const startDateStr = url.searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const endDateStr = url.searchParams.get("endDate");
    const daysParam = parseInt(url.searchParams.get("days") || "", 10);

    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }

    // Resolve the window end: explicit endDate wins, else days (default 14, capped)
    let end: Date;
    if (endDateStr) {
      end = new Date(`${endDateStr}T23:59:59.999Z`);
    } else {
      const n = Math.min(Math.max(Number.isNaN(daysParam) ? 14 : daysParam, 1), MAX_GRID_DAYS);
      end = new Date(start.getTime() + (n - 1) * DAY_MS);
      end.setHours(23, 59, 59, 999);
    }
    if (Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
    }

    /* ── Shape 1: single room (modal calendar) ── */
    if (roomId) {
      const room = await db.room.findUnique({
        where: { id: roomId },
        select: { id: true, name: true, totalCount: true },
      });
      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

      const overridesRaw = await db.roomInventoryDay.findMany({
        where: { roomId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });

      const overrides = overridesRaw.map((o) => ({
        id: o.id,
        date: o.date.toISOString().slice(0, 10),
        availableCount: o.sellableOverride ?? 0,
        isClosed: o.isClosed,
        note: o.note,
      }));

      const bookings = await db.booking.findMany({
        where: {
          roomId,
          status: { not: "CANCELLED" },
          AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
        },
        select: { checkIn: true, checkOut: true },
      });

      const bookedMap: Record<string, number> = {};
      for (const b of bookings) {
        const current = new Date(b.checkIn);
        let guard = 0;
        while (current < b.checkOut && guard < 400) {
          bookedMap[current.toISOString().slice(0, 10)] = (bookedMap[current.toISOString().slice(0, 10)] || 0) + 1;
          current.setUTCDate(current.getUTCDate() + 1);
          guard++;
        }
      }

      return NextResponse.json({ room, overrides, bookedMap });
    }

    /* ── Shape 2: all-rooms grid (day-wise open/close + sellable limits) ── */
    const [allRooms, controls, bookings] = await Promise.all([
      db.room.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, totalCount: true, badge: true },
      }),
      db.roomInventoryDay.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      }),
      db.booking.findMany({
        where: {
          status: { not: "CANCELLED" },
          checkIn: { lt: end },
          checkOut: { gt: start },
        },
        select: { roomId: true, checkIn: true, checkOut: true },
      }),
    ]);

    // booked[roomId][dateStr] = count
    const booked: Record<string, Record<string, number>> = {};
    for (const b of bookings) {
      const current = new Date(b.checkIn);
      let guard = 0;
      while (current < b.checkOut && guard < 400) {
        const ds = current.toISOString().slice(0, 10);
        booked[b.roomId] = booked[b.roomId] || {};
        booked[b.roomId][ds] = (booked[b.roomId][ds] || 0) + 1;
        current.setUTCDate(current.getUTCDate() + 1);
        guard++;
      }
    }

    const controlMap = new Map<string, { isClosed: boolean; sellableOverride: number | null; note: string | null }>();
    for (const c of controls) controlMap.set(`${c.roomId}:${c.date.toISOString().slice(0, 10)}`, c);

    const keys: string[] = [];
    for (let d = new Date(start); d <= end && keys.length < MAX_GRID_DAYS + 1; d.setUTCDate(d.getUTCDate() + 1)) {
      keys.push(dayStr(d));
    }

    const rooms = allRooms.map((r) => {
      const days: Record<string, { booked: number; closed: boolean; override: number | null; sellable: number; note: string | null }> = {};
      for (const k of keys) {
        const c = controlMap.get(`${r.id}:${k}`);
        const override = c?.sellableOverride ?? null;
        const closed = c?.isClosed ?? false;
        const sellable = closed ? 0 : (override ?? r.totalCount);
        days[k] = { booked: booked[r.id]?.[k] || 0, closed, override, sellable, note: c?.note ?? null };
      }
      return { id: r.id, name: r.name, slug: r.slug, totalCount: r.totalCount, badge: r.badge, days };
    });

    return NextResponse.json({
      startDate: startDateStr,
      days: keys.length,
      keys,
      rooms,
    });
  } catch (e) {
    console.error("[/api/admin/inventory GET] error:", e);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

/* ── POST: set / toggle / reset day-wise inventory. Accepts (additively):
 *   { roomId, date, availableCount, note? }           — modal calendar shape
 *   { roomId, date, sellableOverride }                — grid shift+click shape
 *   { roomId, date, isClosed }                        — grid open/close toggle shape
 *   { roomId, date, reset: true }                     — revert to default
 *   …each optionally with dateTo: "YYYY-MM-DD" for a bulk range.            ── */
const upsertSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  availableCount: z.number().int().min(0).max(50).optional(),
  sellableOverride: z.number().int().min(0).max(50).optional(),
  isClosed: z.boolean().optional(),
  reset: z.boolean().optional(),
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

    const { roomId, date, dateTo, availableCount, sellableOverride, isClosed, reset, note } = parsed.data;

    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, totalCount: true },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const toStr = dateTo && dateTo >= date ? dateTo : date;
    const days = dayRange(date, toStr);
    if (days.length === 0) return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    if (days.length > MAX_RANGE_DAYS) {
      return NextResponse.json({ error: `Date range too long (max ${MAX_RANGE_DAYS} days)` }, { status: 400 });
    }

    const fromDate = new Date(`${days[0]}T00:00:00.000Z`);
    const toDate = new Date(`${days[days.length - 1]}T00:00:00.000Z`);

    /* ── RESET: delete overrides → back to default behaviour ── */
    if (reset) {
      const del = await db.roomInventoryDay.deleteMany({
        where: { roomId, date: { gte: fromDate, lte: toDate } },
      });
      await db.auditLog.create({
        data: {
          adminId: admin.id,
          action: "INVENTORY_OVERRIDE_RESET",
          entity: "RoomInventoryDay",
          entityId: `${roomId}:${days[0]}..${days[days.length - 1]}`,
          details: `Room ${roomId} (${room.name}) ${days[0]}..${days[days.length - 1]}: removed ${del.count} inventory override(s)`,
        },
      });
      return NextResponse.json({ ok: true, reset: true, days: del.count });
    }

    const hasCount = availableCount !== undefined || sellableOverride !== undefined;
    if (!hasCount && isClosed === undefined) {
      return NextResponse.json({ error: "Nothing to update: provide availableCount, sellableOverride or isClosed" }, { status: 400 });
    }

    const existingRows = await db.roomInventoryDay.findMany({
      where: { roomId, date: { gte: fromDate, lte: toDate } },
    });
    const existingDates = new Set(existingRows.map((r) => r.date.toISOString().slice(0, 10)));

    // Notes are only rewritten for single-day edits that explicitly pass one
    const singleNote = days.length === 1 && note !== undefined ? (note || null) : undefined;

    if (hasCount) {
      // Count shape — mirrors the modal calendar semantics: 0 = stop sale (closed)
      const v = (availableCount ?? sellableOverride) as number;
      await db.roomInventoryDay.updateMany({
        where: { roomId, date: { gte: fromDate, lte: toDate } },
        data: { sellableOverride: v, isClosed: v === 0, ...(singleNote !== undefined ? { note: singleNote } : {}) },
      });
      const missing = days.filter((d) => !existingDates.has(d));
      if (missing.length > 0) {
        await db.roomInventoryDay.createMany({
          data: missing.map((d) => ({
            roomId,
            date: new Date(`${d}T00:00:00.000Z`),
            sellableOverride: v,
            isClosed: v === 0,
            note: singleNote ?? null,
          })),
        });
      }
    } else {
      // Toggle shape — flip open/close without touching sellableOverride
      await db.roomInventoryDay.updateMany({
        where: { roomId, date: { gte: fromDate, lte: toDate } },
        data: { isClosed },
      });
      if (isClosed) {
        const missing = days.filter((d) => !existingDates.has(d));
        if (missing.length > 0) {
          await db.roomInventoryDay.createMany({
            data: missing.map((d) => ({
              roomId,
              date: new Date(`${d}T00:00:00.000Z`),
              isClosed: true,
              sellableOverride: null,
              note: singleNote ?? null,
            })),
          });
        }
      }
      // isClosed=false on days without a row → nothing to do (default is open)
    }

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "INVENTORY_OVERRIDE_SET",
        entity: "RoomInventoryDay",
        entityId: `${roomId}:${days[0]}${days.length > 1 ? `..${days[days.length - 1]}` : ""}`,
        details:
          hasCount
            ? `Room ${roomId} (${room.name}) ${days[0]}${days.length > 1 ? `..${days[days.length - 1]}` : ""}: set sellable=${availableCount ?? sellableOverride} (${days.length} day${days.length > 1 ? "s" : ""})`
            : `Room ${roomId} (${room.name}) ${days[0]}${days.length > 1 ? `..${days[days.length - 1]}` : ""}: ${isClosed ? "CLOSED" : "reopened"} (${days.length} day${days.length > 1 ? "s" : ""})`,
      },
    });

    return NextResponse.json({
      ok: true,
      days: days.length,
      date: days[0],
      dateTo: days.length > 1 ? days[days.length - 1] : undefined,
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
