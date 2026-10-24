import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import { BRAJ_CALENDAR_PRESET } from "@/lib/calendar-preset";

export const dynamic = "force-dynamic";

/**
 * Content calendar admin API (Task 4) — CRUD for the Braj content calendar.
 *
 * GET            → all rows (newest month first), with the linked post title
 * POST           → create a row
 * POST ?seed=all → one-click pre-fill of the suggested Braj calendar rows
 *                  (Janmashtami, Radhashtami, Holi, Kartik month...). Only
 *                  rows that do not exist yet are added (matched on
 *                  month+event) — nothing is overwritten or deleted.
 * PATCH          → update a row
 * DELETE ?id=    → delete a row (the linked POST is never deleted)
 */

const calendarSchema = z.object({
  id: z.string().optional(),
  month: z.string().min(4), // "YYYY-MM" or "TODO"
  event: z.string().min(1),
  targetKeywords: z.string(), // JSON array string
  category: z.string().min(1),
  status: z.enum(["PLANNED", "DRAFTED", "PUBLISHED"]),
  linkedPostId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function parseRows(rows: any[]) {
  return rows.map((r) => ({
    ...r,
    targetKeywords: (() => { try { return JSON.parse(r.targetKeywords || "[]"); } catch { return []; } })(),
    post: r.linkedPost
      ? { id: r.linkedPost.id, slug: r.linkedPost.slug, title: r.linkedPost.title, status: r.linkedPost.status }
      : null,
  }));
}

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.contentCalendar.findMany({
    orderBy: [{ month: "asc" }, { event: "asc" }],
    include: { linkedPost: { select: { id: true, slug: true, title: true, status: true } } },
  });
  return NextResponse.json({ rows: parseRows(rows) });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const seed = url.searchParams.get("seed");

    // One-click pre-fill of the suggested Braj calendar.
    if (seed === "all") {
      const existing = await db.contentCalendar.findMany({ select: { month: true, event: true } });
      const have = new Set(existing.map((r) => `${r.month}|${r.event}`));
      let created = 0;
      for (const row of BRAJ_CALENDAR_PRESET) {
        if (have.has(`${row.month}|${row.event}`)) continue;
        await db.contentCalendar.create({ data: row });
        created++;
      }
      await db.auditLog.create({
        data: { adminId: admin.id, action: "CALENDAR_SEEDED", entity: "ContentCalendar", details: `Pre-filled ${created} Braj calendar row(s)` },
      });
      return NextResponse.json({ ok: true, created });
    }

    const body = await req.json();
    const parsed = calendarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid calendar data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const row = await db.contentCalendar.create({
      data: {
        month: d.month, event: d.event, targetKeywords: d.targetKeywords,
        category: d.category, status: d.status,
        linkedPostId: d.linkedPostId || null, notes: d.notes || null,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "CALENDAR_CREATED", entity: "ContentCalendar", entityId: row.id, details: `Added ${row.event} (${row.month})` },
    });
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[/api/admin/calendar POST] error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = calendarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid calendar data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (!d.id) return NextResponse.json({ error: "Row id required" }, { status: 400 });
    const row = await db.contentCalendar.update({
      where: { id: d.id },
      data: {
        month: d.month, event: d.event, targetKeywords: d.targetKeywords,
        category: d.category, status: d.status,
        linkedPostId: d.linkedPostId || null, notes: d.notes || null,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "CALENDAR_UPDATED", entity: "ContentCalendar", entityId: row.id, details: `Updated ${row.event} (${row.month})` },
    });
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[/api/admin/calendar PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Row id required" }, { status: 400 });
    const row = await db.contentCalendar.findUnique({ where: { id } });
    await db.contentCalendar.delete({ where: { id } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "CALENDAR_DELETED", entity: "ContentCalendar", entityId: id, details: `Deleted ${row?.event || id}` },
    });
    // NOTE: the linked BlogPost is intentionally NOT deleted.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/calendar DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
