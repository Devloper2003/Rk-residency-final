/**
 * inventory.ts — server-side per-night availability with day-by-day
 * inventory control (Phase 4).
 *
 * Model:
 *   - Every Room has `totalCount` physical rooms.
 *   - A stay occupies one room for each NIGHT in [checkIn, checkOut).
 *   - Bookings with status != CANCELLED count against every night they span.
 *   - RoomInventoryDay rows (Admin → Inventory) can, per calendar day:
 *       * CLOSE the room type entirely (isClosed → sellable 0)
 *       * override the sellable count (sellableOverride, clamped ≥ 0)
 *     A date with NO row behaves exactly as before (sellable = totalCount),
 *     so existing sites keep working unchanged.
 *
 * Availability for a range = min across all nights of
 *   sellableThatNight − bookedThatNight.
 */
import { db } from "@/lib/db";

export type InventoryDayRow = {
  date: Date;
  isClosed: boolean;
  sellableOverride: number | null;
};

/** Effective sellable count for one calendar day. */
export function effectiveSellable(
  totalCount: number,
  day?: Pick<InventoryDayRow, "isClosed" | "sellableOverride"> | null
): number {
  if (!day) return totalCount;
  if (day.isClosed) return 0;
  if (day.sellableOverride !== null && day.sellableOverride !== undefined) {
    return Math.max(0, day.sellableOverride);
  }
  return totalCount;
}

/** Iterate UTC-midnight day keys for every night of the stay. */
export function nightKeys(checkIn: Date, checkOut: Date): string[] {
  const keys: string[] = [];
  const cur = new Date(
    Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate())
  );
  const end = new Date(
    Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate())
  );
  while (cur < end) {
    keys.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return keys;
}

/** Booked-room count for each night key from overlapping bookings. */
export function bookedPerNight(
  bookings: { checkIn: Date; checkOut: Date }[],
  keys: string[]
): Record<string, number> {
  const booked: Record<string, number> = {};
  for (const key of keys) booked[key] = 0;
  for (const b of bookings) {
    for (const key of nightKeys(new Date(b.checkIn), new Date(b.checkOut))) {
      if (key in booked) booked[key] += 1;
    }
  }
  return booked;
}

/**
 * Check availability of a room for a stay range, honouring per-day
 * open/close control. Used by /api/bookings/check, /api/bookings and the
 * admin manual-booking API.
 *
 * Pass a Prisma transaction client via `tx` when checking inside a
 * transaction (the public booking write does this to prevent double-booking).
 */
export async function checkRangeAvailability(
  roomId: string,
  totalCount: number,
  checkIn: Date,
  checkOut: Date,
  tx: Pick<typeof db, "booking" | "roomInventoryDay"> = db
): Promise<{ available: boolean; minRoomsLeft: number; closedDates: string[] }> {
  const keys = nightKeys(checkIn, checkOut);
  if (keys.length === 0) {
    return { available: false, minRoomsLeft: 0, closedDates: [] };
  }

  const [bookings, inventoryDays] = await Promise.all([
    tx.booking.findMany({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
      select: { checkIn: true, checkOut: true },
    }),
    tx.roomInventoryDay.findMany({
      where: { roomId, date: { in: keys.map((k) => new Date(`${k}T00:00:00.000Z`)) } },
      select: { date: true, isClosed: true, sellableOverride: true },
    }),
  ]);

  const booked = bookedPerNight(bookings, keys);
  const dayByKey = new Map<string, InventoryDayRow>();
  for (const row of inventoryDays) {
    dayByKey.set(row.date.toISOString().slice(0, 10), row);
  }

  let minRoomsLeft = Number.POSITIVE_INFINITY;
  const closedDates: string[] = [];
  for (const key of keys) {
    const sellable = effectiveSellable(totalCount, dayByKey.get(key));
    const left = Math.max(0, sellable - booked[key]);
    if (sellable === 0) closedDates.push(key);
    if (left < minRoomsLeft) minRoomsLeft = left;
  }

  return {
    available: minRoomsLeft > 0,
    minRoomsLeft: minRoomsLeft === Number.POSITIVE_INFINITY ? 0 : minRoomsLeft,
    closedDates,
  };
}
