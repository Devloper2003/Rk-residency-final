import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/site-content
 * Public endpoint that returns all editable site content as a flat key→value map.
 * The website reads this once on mount (see useSiteContent hook) and uses the
 * values with sensible fallbacks. No auth required — content is public.
 *
 * Returns: { content: { [key]: value }, bySection: { [section]: [...] } }
 */
export async function GET() {
  try {
    const items = await db.siteContent.findMany({
      select: { id: true, key: true, value: true, section: true, type: true, label: true },
      orderBy: [{ section: "asc" }, { key: "asc" }],
    });
    const content: Record<string, string> = {};
    const bySection: Record<string, { key: string; value: string; type: string; label: string | null }[]> = {};
    for (const it of items) {
      content[it.key] = it.value;
      if (!bySection[it.section]) bySection[it.section] = [];
      bySection[it.section].push({ key: it.key, value: it.value, type: it.type, label: it.label });
    }
    return NextResponse.json({ content, bySection });
  } catch (e) {
    console.error("[/api/site-content] error:", e);
    return NextResponse.json({ content: {}, bySection: {} });
  }
}
