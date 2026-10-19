import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCronOrAdmin } from "@/lib/cron-auth";
import { buildDraftPrompt, callAnthropic, parseDraftJson } from "@/lib/ai-draft";
import { clampText } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET/POST /api/cron/monthly-drafts — monthly AI pre-writing (Task 5).
 *
 * Runs on the 1st of each month (see vercel.json) and creates AI DRAFTS for
 * NEXT month's calendar rows that have no linked post. Protected by
 * CRON_SECRET (Vercel Cron sends it as a Bearer token) or the owner's admin
 * session.
 *
 * Safety rails:
 *   - one draft per calendar row (rows with linkedPostId are skipped);
 *   - at most 8 drafts per run (long-tail rows wait for the next run);
 *   - every draft is saved as status DRAFT — nothing auto-publishes;
 *   - failures on one row do not stop the others; each error is reported.
 */
async function runMonthlyDrafts() {
  const now = new Date();
  // Next calendar month as "YYYY-MM".
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  const rows = await db.contentCalendar.findMany({
    where: { month: nextMonth, linkedPostId: null },
    orderBy: [{ event: "asc" }],
    take: 8,
  });

  const results: { event: string; ok: boolean; slug?: string; verifyCount?: number; error?: string }[] = [];

  for (const row of rows) {
    try {
      let keywords: string[] = [];
      try { keywords = JSON.parse(row.targetKeywords || "[]"); } catch { /* none */ }
      if (!keywords.length) keywords = [`${row.event} Vrindavan`];

      const raw = await callAnthropic(
        buildDraftPrompt({ event: row.event, month: row.month, category: row.category, keywords, notes: row.notes })
      );
      const draft = parseDraftJson(raw);

      const post = await db.blogPost.create({
        data: {
          slug: draft.slug,
          title: draft.title,
          excerpt: draft.excerpt,
          body: draft.body,
          category: row.category || draft.category || "FESTIVAL",
          tags: JSON.stringify(draft.tags),
          imageUrl: null,
          status: "DRAFT",
          published: false,
          publishedAt: null,
          metaTitle: draft.metaTitle || clampText(draft.title, 60),
          metaDescription: draft.metaDescription || clampText(draft.excerpt, 155),
          targetKeyword: keywords[0] || null,
          calendarId: row.id,
          aiGenerated: true,
          coverImageTitle: draft.coverImageTitle || null,
          coverImageBrief: draft.coverImageBrief || null,
          readingMins: draft.readingTime,
          readingMinsAuto: false,
        },
      });
      await db.contentCalendar.update({
        where: { id: row.id },
        data: { linkedPostId: post.id, status: "DRAFTED" },
      });
      results.push({ event: row.event, ok: true, slug: post.slug, verifyCount: draft.body.match(/\[VERIFY\]/g)?.length || 0 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "generation failed";
      console.error(`[/api/cron/monthly-drafts] ${row.event}:`, message);
      results.push({ event: row.event, ok: false, error: message.slice(0, 200) });
    }
  }

  return {
    ok: true,
    month: nextMonth,
    considered: rows.length,
    draftsCreated: results.filter((r) => r.ok).length,
    failures: results.filter((r) => !r.ok).length,
    results,
  };
}

export async function GET(req: Request) {
  const auth = await verifyCronOrAdmin(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runMonthlyDrafts());
  } catch (e) {
    console.error("[/api/cron/monthly-drafts] error:", e);
    return NextResponse.json({ error: "Monthly draft run failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
