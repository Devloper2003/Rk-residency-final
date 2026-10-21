import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms/rates?roomId=...&planId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * Returns the effective night-by-night price for a rate plan:
 *   { ok: true, plan: {...}, nights: [{ date, price, override }], subtotal }
 *
 * Public endpoint — returns only active plans and prices (no availability).
 * Used by the booking widget to show day-wise pricing before checkout.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");
    const planId = url.searchParams.get("planId");
    const checkInStr = url.searchParams.get("checkIn");
    const checkOutStr = url.searchParams.get("checkOut");

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
      select: { id: true, code: true, name: true, pricePerNight: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { planNightRates } = await import("@/lib/rate-plans");
    const { nights, subtotal } = await planNightRates(planId, checkIn, checkOut);

    return NextResponse.json({
      ok: true,
      plan,
      nights,
      subtotal,
      currency: "INR",
    });
  } catch (e) {
    console.error("[/api/rooms/rates] error:", e);
    return NextResponse.json({ error: "Failed to compute rates" }, { status: 500 });
  }
}
