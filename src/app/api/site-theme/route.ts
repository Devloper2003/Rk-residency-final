import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/site-theme — public, returns theme colors as key→value map */
export async function GET() {
  try {
    const themes = await db.themeSetting.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const t of themes) map[t.key] = t.value;
    return NextResponse.json({ theme: map });
  } catch {
    return NextResponse.json({ theme: {} });
  }
}
