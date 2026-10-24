/**
 * rate-plans.ts — shared server-side helpers for OTA-style rate plans.
 *
 * A room can have several rate plans (EP / CP / MAP / AP). Each plan carries:
 *   pricePerNight   → standard DOUBLE (2-person) rate
 *   priceSingle     → 1-person rate (null = same as double)
 *   extraAdultPrice → per-night charge per adult beyond 2
 *   extraChildPrice → per-night charge per child
 * The admin can additionally set day-specific overrides (PlanDayRate) for any
 * of those rates and can CLOSE a plan for a specific day (channel-manager 🚫).
 *
 * Effective nightly price for a plan on a date =
 *   PlanDayRate row (if any) → per-occupancy, else the plan's base rates.
 */

import { db } from "@/lib/db";

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  inclusions: string[];
  pricePerNight: number; // standard 2-person rate
  priceSingle: number; // resolved 1-person rate (falls back to double)
  extraAdultPrice: number; // per extra adult / night (0 = not charged)
  extraChildPrice: number; // per child / night (0 = not charged)
  sortOrder: number;
};

/** Parse the JSON-encoded inclusions column defensively. */
export function parseInclusions(raw: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Shape a Prisma RatePlan row for public consumption. */
export function toPublicPlan(p: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  inclusions: string;
  pricePerNight: number;
  priceSingle?: number | null;
  extraAdultPrice?: number | null;
  extraChildPrice?: number | null;
  sortOrder: number;
}): PublicPlan {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    inclusions: parseInclusions(p.inclusions),
    pricePerNight: p.pricePerNight,
    priceSingle: p.priceSingle && p.priceSingle > 0 ? p.priceSingle : p.pricePerNight,
    extraAdultPrice: p.extraAdultPrice || 0,
    extraChildPrice: p.extraChildPrice || 0,
    sortOrder: p.sortOrder,
  };
}

/** All ACTIVE plans for a room, cheapest first within the owner's sort order. */
export async function getActivePlans(roomId: string): Promise<PublicPlan[]> {
  const plans = await db.ratePlan.findMany({
    where: { roomId, isActive: true, pricePerNight: { gt: 0 } },
    orderBy: [{ sortOrder: "asc" }, { pricePerNight: "asc" }],
  });
  return plans.map(toPublicPlan);
}

export type NightRate = { date: string; price: number; override: boolean };

/** Base rates for a plan row (with sensible fallbacks). */
export type PlanBaseRates = {
  pricePerNight: number; // double
  priceSingle: number;
  extraAdultPrice: number;
  extraChildPrice: number;
};

/** Per-day override slice (all optional — null/undefined = use plan base). */
export type DayRateOverride = {
  price?: number | null;
  priceSingle?: number | null;
  extraAdultPrice?: number | null;
  extraChildPrice?: number | null;
  isClosed?: boolean;
} | null | undefined;

/**
 * One night's price for the given occupancy.
 *   1 adult            → single rate
 *   2 adults           → double rate (pricePerNight)
 *   3+ adults          → double + (n-2) × extraAdultPrice
 *   children           → + extraChildPrice each (every night)
 */
export function nightlyOccupancyPrice(
  base: PlanBaseRates,
  day: DayRateOverride,
  adults: number,
  children: number
): number {
  const double = day?.price != null && day.price > 0 ? day.price : base.pricePerNight;
  const single = day?.priceSingle != null && day.priceSingle > 0 ? day.priceSingle : base.priceSingle;
  const extraAdult = day?.extraAdultPrice != null && day.extraAdultPrice > 0 ? day.extraAdultPrice : base.extraAdultPrice;
  const extraChild = day?.extraChildPrice != null && day.extraChildPrice > 0 ? day.extraChildPrice : base.extraChildPrice;

  const roomRate = adults <= 1 ? Math.min(single, double) : double;
  const extraAdults = Math.max(0, adults - 2);
  return roomRate + extraAdults * extraAdult + children * extraChild;
}

/**
 * Night-by-night effective price for a plan between checkIn (inclusive) and
 * checkOut (exclusive) for the given occupancy. Used by the booking engine so
 * festival/weekend day-rates apply automatically, exactly like an OTA.
 * Days where the plan is admin-closed come back in closedDates and are NOT
 * priced (booking must be rejected upstream).
 */
export async function planNightRates(
  planId: string,
  checkIn: Date,
  checkOut: Date,
  occupancy?: { adults: number; children: number }
): Promise<{
  plan: { id: string; code: string; name: string; pricePerNight: number; priceSingle: number; extraAdultPrice: number; extraChildPrice: number } | null;
  nights: NightRate[];
  subtotal: number;
  closedDates: string[];
}> {
  const adults = Math.max(1, occupancy?.adults ?? 2);
  const children = Math.max(0, occupancy?.children ?? 0);

  const plan = await db.ratePlan.findUnique({
    where: { id: planId },
    select: {
      id: true, code: true, name: true, pricePerNight: true,
      priceSingle: true, extraAdultPrice: true, extraChildPrice: true,
      isActive: true, roomId: true,
    },
  });
  if (!plan || !plan.isActive) return { plan: null, nights: [], subtotal: 0, closedDates: [] };

  const base: PlanBaseRates = {
    pricePerNight: plan.pricePerNight,
    priceSingle: plan.priceSingle && plan.priceSingle > 0 ? plan.priceSingle : plan.pricePerNight,
    extraAdultPrice: plan.extraAdultPrice || 0,
    extraChildPrice: plan.extraChildPrice || 0,
  };

  const overrides = await db.planDayRate.findMany({
    where: { planId, date: { gte: checkIn, lt: checkOut } },
    select: { date: true, price: true, priceSingle: true, extraAdultPrice: true, extraChildPrice: true, isClosed: true },
  });
  const overrideMap = new Map<string, DayRateOverride>();
  for (const o of overrides) {
    overrideMap.set(o.date.toISOString().slice(0, 10), {
      price: o.price,
      priceSingle: o.priceSingle,
      extraAdultPrice: o.extraAdultPrice,
      extraChildPrice: o.extraChildPrice,
      isClosed: o.isClosed,
    });
  }

  const nights: NightRate[] = [];
  const closedDates: string[] = [];
  let subtotal = 0;
  const current = new Date(checkIn);
  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setUTCHours(0, 0, 0, 0);
  while (current < end) {
    const key = current.toISOString().slice(0, 10);
    const day = overrideMap.get(key);

    if (day?.isClosed) {
      closedDates.push(key);
      current.setUTCDate(current.getUTCDate() + 1);
      continue;
    }

    const hasOverride = day != null && ((day.price != null && day.price > 0) || (day.priceSingle != null && day.priceSingle > 0) || (day.extraAdultPrice != null && day.extraAdultPrice > 0) || (day.extraChildPrice != null && day.extraChildPrice > 0));
    const price = nightlyOccupancyPrice(base, day, adults, children);
    nights.push({ date: key, price, override: hasOverride });
    subtotal += price;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return {
    plan: {
      id: plan.id, code: plan.code, name: plan.name,
      pricePerNight: base.pricePerNight, priceSingle: base.priceSingle,
      extraAdultPrice: base.extraAdultPrice, extraChildPrice: base.extraChildPrice,
    },
    nights,
    subtotal,
    closedDates,
  };
}
