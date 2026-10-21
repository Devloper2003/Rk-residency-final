/**
 * rate-plans.ts — shared server-side helpers for OTA-style rate plans.
 *
 * A room can have several rate plans (EP / CP / MAP / AP), each with a base
 * pricePerNight. The admin can additionally set a day-specific price for any
 * plan (PlanDayRate) — festival surge, weekend rates, off-season discounts.
 *
 * Effective nightly price for a plan = PlanDayRate for that date if one
 * exists, otherwise the plan's base pricePerNight.
 */

import { db } from "@/lib/db";

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  inclusions: string[];
  pricePerNight: number;
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
  sortOrder: number;
}): PublicPlan {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    inclusions: parseInclusions(p.inclusions),
    pricePerNight: p.pricePerNight,
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

/**
 * Night-by-night effective price for a plan between checkIn (inclusive) and
 * checkOut (exclusive). Used by the booking engine so festival/weekend
 * day-rates apply automatically, exactly like an OTA.
 */
export async function planNightRates(
  planId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ plan: { id: string; code: string; name: string; pricePerNight: number } | null; nights: NightRate[]; subtotal: number }> {
  const plan = await db.ratePlan.findUnique({
    where: { id: planId },
    select: { id: true, code: true, name: true, pricePerNight: true, isActive: true, roomId: true },
  });
  if (!plan || !plan.isActive) return { plan: null, nights: [], subtotal: 0 };

  const overrides = await db.planDayRate.findMany({
    where: { planId, date: { gte: checkIn, lt: checkOut } },
    select: { date: true, price: true },
  });
  const overrideMap = new Map<string, number>();
  for (const o of overrides) {
    overrideMap.set(o.date.toISOString().slice(0, 10), o.price);
  }

  const nights: NightRate[] = [];
  const current = new Date(checkIn);
  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setUTCHours(0, 0, 0, 0);
  while (current < end) {
    const key = current.toISOString().slice(0, 10);
    const overridePrice = overrideMap.get(key);
    const hasOverride = overridePrice !== undefined && overridePrice > 0;
    nights.push({
      date: key,
      price: hasOverride ? (overridePrice as number) : plan.pricePerNight,
      override: hasOverride,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const subtotal = nights.reduce((sum, n) => sum + n.price, 0);
  return {
    plan: { id: plan.id, code: plan.code, name: plan.name, pricePerNight: plan.pricePerNight },
    nights,
    subtotal,
  };
}
