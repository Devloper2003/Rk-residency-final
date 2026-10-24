import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/rates?roomId=...&planId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *                     &adults=1..12&children=0..8   (optional — default 2 adults)
 *
 * Returns the effective night-by-night price for a rate plan at the given
 * occupancy (1 person vs 2 persons vs extra adults/children):
 *   { ok: true, plan: {...}, nights: [{ date, price, override }],
 *     subtotal, closedDates: ["YYYY-MM-DD", ...] }
 *
 * Public endpoint — returns only active plans and prices (no availability).
 * If the admin closed this plan for any night, those dates come back in
 * closedDates and are excluded from the subtotal — the widget must block.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    const planId = url.searchParams.get("planId");
    const checkInStr = url.searchParams.get("checkIn");
    const checkOutStr = url.searchParams.get("checkOut");
    const adults = Math.min(12, Math.max(1, parseInt(url.searchParams.get("adults") || "2", 10) || 2));
    const children = Math.min(8, Math.max(0, parseInt(url.searchParams.get("children") || "0", 10) || 0));

    if (!roomId || !planId || !checkInStr || !checkOutStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const checkIn = new Date(`${checkInStr}T00:00:00Z`);
    const checkOut = new Date(`${checkOutStr}T00:00:00Z`);
    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    ) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }
    // Guard against absurd ranges (max 30 nights like the booking widget).
    const maxNights = 30 * 24 * 60 * 60 * 1000;
    if (checkOut.getTime() - checkIn.getTime() > maxNights) {
      return NextResponse.json({ error: "Stay too long" }, { status: 400 });
    }

    // Plan must belong to the given room — prevents cross-room probing.
    const plan = await db.ratePlan.findFirst({
      where: { id: planId, roomId, isActive: true },
      select: {
        id: true, code: true, name: true, pricePerNight: true,
        priceSingle: true, extraAdultPrice: true, extraChildPrice: true,
      },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { planNightRates } = await import("@/lib/rate-plans");
    const { nights, subtotal, closedDates } = await planNightRates(planId, checkIn, checkOut, { adults, children });

    return NextResponse.json({
      ok: true,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        pricePerNight: plan.pricePerNight,
        priceSingle: plan.priceSingle && plan.priceSingle > 0 ? plan.priceSingle : plan.pricePerNight,
        extraAdultPrice: plan.extraAdultPrice || 0,
        extraChildPrice: plan.extraChildPrice || 0,
      },
      occupancy: { adults, children },
      nights,
      subtotal,
      closedDates,
      currency: "INR",
    });
  } catch (e) {
    console.error("[/api/rooms/rates] error:", e);
    return NextResponse.json({ error: "Failed to compute rates" }, { status: 500 });
  }
}
