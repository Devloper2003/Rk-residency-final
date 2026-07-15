import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/site-content — public, returns all content items as a key→value map */
export async function GET() {
  try {
    const items = await db.siteContent.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const item of items) map[item.key] = item.value;
    return NextResponse.json({ content: map });
  } catch {
    return NextResponse.json({ content: {} });
  }
}
