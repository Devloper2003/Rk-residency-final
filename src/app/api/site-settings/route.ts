import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/site-settings — public, returns all settings as a key→value map */
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json({ settings: map });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}
