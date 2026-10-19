import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { buildDraftPrompt, callAnthropic, parseDraftJson } from "@/lib/ai-draft";
import { clampText } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/admin/generate-draft — AI draft generator (Task 5).
 *
 * Body: { calendarId }
 *
 * - Calls the Anthropic API from the SERVER only (ANTHROPIC_API_KEY stays in
 *   the environment; the client only sees the generated draft or an error).
 * - The result is ALWAYS saved as a DRAFT (never auto-published).
 * - The draft is linked to the calendar row (linkedPostId, status=DRAFTED).
 * - Only ONE auto-generated draft per calendar row: generating again returns
 *   a clear 409 while a linked draft/post still exists.
 * - [VERIFY] markers stay in the body; the editor highlights them and blocks
 *   publishing until a human resolves them.
 */
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const calendarId = body?.calendarId;
    if (!calendarId) return NextResponse.json({ error: "calendarId is required" }, { status: 400 });

    const row = await db.contentCalendar.findUnique({ where: { id: calendarId } });
    if (!row) return NextResponse.json({ error: "Calendar row not found" }, { status: 404 });

    // Quality guardrail (Task 9): one auto-generated draft per calendar row.
    if (row.linkedPostId) {
      const existing = await db.blogPost.findUnique({ where: { id: row.linkedPostId } });
      if (existing) {
        return NextResponse.json(
          { error: `This row already has a linked post: “${existing.title}” (${existing.status.toLowerCase()}). Delete or unlink it before generating another draft.` },
          { status: 409 }
        );
      }
    }

    // Parse target keywords from the row.
    let keywords: string[] = [];
    try { keywords = JSON.parse(row.targetKeywords || "[]"); } catch { /* none */ }
    if (!keywords.length) keywords = [`${row.event} Vrindavan`];

    const prompt = buildDraftPrompt({
      event: row.event,
      month: row.month,
      category: row.category,
      keywords,
      notes: row.notes,
    });

    const raw = await callAnthropic(prompt);
    const draft = parseDraftJson(raw);

    // Save as DRAFT — never auto-publish AI content.
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
        readingMinsAuto: false, // keep the model's estimate visible until reviewed
      },
    });

    await db.contentCalendar.update({
      where: { id: row.id },
      data: { linkedPostId: post.id, status: "DRAFTED" },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "AI_DRAFT_GENERATED",
        entity: "BlogPost",
        entityId: post.id,
        details: `AI draft for ${row.event} (${row.month}) — ${draft.body.match(/\[VERIFY\]/g)?.length || 0} [VERIFY] marker(s)`,
      },
    });

    const verifyCount = draft.body.match(/\[VERIFY\]/g)?.length || 0;
    return NextResponse.json({
      ok: true,
      post: { id: post.id, slug: post.slug, title: post.title, status: post.status },
      verifyCount,
      internalLinks: draft.internalLinks,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI generation failed";
    console.error("[/api/admin/generate-draft] error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
