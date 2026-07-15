import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const offers = await db.offer.findMany({
      orderBy: [{ featured: "desc" }, { validFrom: "asc" }],
    });
    return NextResponse.json({ offers });
  } catch (e) {
    console.error("[/api/offers] error:", e);
    return NextResponse.json({ offers: [], error: "Failed to load offers" }, { status: 500 });
  }
}
