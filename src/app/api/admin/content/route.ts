import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Content keys introduced AFTER the original seed. The admin GET below
 * ensures these rows exist — create-if-missing ONLY, it never overwrites
 * an existing value. This keeps the Page Editor complete on databases that
 * were seeded before a key existed: every editable image/text always shows
 * up in the admin, so nothing is ever "stuck in the code" again.
 * Additive and idempotent — zero risk to existing data.
 */
const ENSURE_DEFAULTS: { key: string; value: string; section: string; type: string; label: string }[] = [
  { key: "dining.image_alt", value: "Satvik thali on a heritage brass plate at RK Residency", section: "dining", type: "text", label: "Image alt text" },
  { key: "rooms_page.background_image", value: "/images/heritage-room.webp", section: "rooms_page", type: "image", label: "Header background image" },
  { key: "rooms_page.background_image_alt", value: "Heritage room interior at RK Residency Vrindavan", section: "rooms_page", type: "text", label: "Header image alt text" },
];

async function ensureDefaultRows() {
  try {
    const existing = await db.siteContent.findMany({
      where: { key: { in: ENSURE_DEFAULTS.map((d) => d.key) } },
      select: { key: true },
    });
    const have = new Set(existing.map((e) => e.key));
    const missing = ENSURE_DEFAULTS.filter((d) => !have.has(d.key));
    if (missing.length) await db.siteContent.createMany({ data: missing });
  } catch (e) {
    console.error("[admin/content ensureDefaultRows]", e);
  }
}

/** GET /api/admin/content — returns all site content items, grouped by section */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Create any post-seed default rows that are missing (additive only).
  await ensureDefaultRows();

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
