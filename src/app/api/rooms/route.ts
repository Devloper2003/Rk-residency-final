import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      orderBy: [{ sortOrder: "asc" }],
    });
    return NextResponse.json({ rooms });
  } catch (e) {
    console.error("[/api/rooms] error:", e);
    return NextResponse.json({ rooms: [], error: "Failed to load rooms" }, { status: 500 });
  }
}
