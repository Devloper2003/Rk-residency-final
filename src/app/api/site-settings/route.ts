import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/site-settings — public, returns all settings as a key→value map.
 * Sets aggressive no-store headers so the browser never serves stale data.
 */
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    const res = NextResponse.json({ settings: map });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch {
    return NextResponse.json({ settings: {} });
  }
}
