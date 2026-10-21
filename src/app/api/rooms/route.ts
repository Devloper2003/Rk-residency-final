import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActivePlans } from "@/lib/rate-plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      orderBy: [{ sortOrder: "asc" }],
      include: {
        ratePlans: {
          where: { isActive: true, pricePerNight: { gt: 0 } },
          orderBy: [{ sortOrder: "asc" }, { pricePerNight: "asc" }],
        },
      },
    });

    // Shape plans for public consumption (parse JSON inclusions defensively).
    const { toPublicPlan } = await import("@/lib/rate-plans");
    const roomsWithPlans = rooms.map(({ ratePlans, ...room }) => ({
      ...room,
      plans: ratePlans.map(toPublicPlan),
    }));

    return NextResponse.json({ rooms: roomsWithPlans });
  } catch (e) {
    console.error("[/api/rooms] error:", e);
    return NextResponse.json({ rooms: [], error: "Failed to load rooms" }, { status: 500 });
  }
}
