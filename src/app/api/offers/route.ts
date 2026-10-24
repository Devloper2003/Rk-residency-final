import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const offers = await db.offer.findMany({
      // Expired festival packages are never shown anywhere (audit C1/H4 —
      // stale festival dates). Same filter as the SSR homepage query.
      where: { validUntil: { gte: new Date() } },
      orderBy: [{ featured: "desc" }, { validFrom: "asc" }],
    });
    return NextResponse.json({ offers });
  } catch (e) {
    console.error("[/api/offers] error:", e);
    return NextResponse.json({ offers: [], error: "Failed to load offers" }, { status: 500 });
  }
}
