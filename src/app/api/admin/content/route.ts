import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** GET /api/admin/content — returns all site content items, grouped by section */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.siteContent.findMany({ orderBy: [{ section: "asc" }, { key: "asc" }] });
  return NextResponse.json({ items });
}

const updateSchema = z.object({
  id: z.string(),
  value: z.string(),
});

/** PATCH /api/admin/content — update a single content item's value */
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const item = await db.siteContent.update({
      where: { id: parsed.data.id },
      data: { value: parsed.data.value },
    });

    await db.auditLog.create({
      data: { adminId: admin.id, action: "CONTENT_UPDATED", entity: "SiteContent", entityId: item.id, details: `Updated "${item.key}" = "${item.value.slice(0, 50)}"` },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    console.error("[/api/admin/content PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

const createSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  section: z.string().min(1),
  type: z.string().default("text"),
  label: z.string().optional(),
});

/** POST /api/admin/content — create a new content item */
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const item = await db.siteContent.create({ data: parsed.data });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "CONTENT_CREATED", entity: "SiteContent", entityId: item.id, details: `Created "${item.key}"` },
    });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    console.error("[/api/admin/content POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
