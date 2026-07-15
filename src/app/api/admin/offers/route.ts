import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const offerSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  perks: z.string(),
  discountPct: z.number().int().nullable(),
  validFrom: z.string(),
  validUntil: z.string(),
  imageUrl: z.string().nullable(),
  badge: z.string().nullable(),
  featured: z.boolean(),
});

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offers = await db.offer.findMany({ orderBy: [{ featured: "desc" }, { validFrom: "asc" }] });
  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = offerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid offer data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const offer = await db.offer.create({
      data: {
        slug: d.slug, title: d.title, tagline: d.tagline, description: d.description,
        perks: d.perks, discountPct: d.discountPct,
        validFrom: new Date(d.validFrom), validUntil: new Date(d.validUntil),
        imageUrl: d.imageUrl, badge: d.badge, featured: d.featured,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "OFFER_CREATED", entity: "Offer", entityId: offer.id, details: `Created offer ${offer.title}` },
    });
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    console.error("[/api/admin/offers POST] error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = offerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid offer data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (!d.id) return NextResponse.json({ error: "Offer id required for update" }, { status: 400 });

    const offer = await db.offer.update({
      where: { id: d.id },
      data: {
        slug: d.slug, title: d.title, tagline: d.tagline, description: d.description,
        perks: d.perks, discountPct: d.discountPct,
        validFrom: new Date(d.validFrom), validUntil: new Date(d.validUntil),
        imageUrl: d.imageUrl, badge: d.badge, featured: d.featured,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "OFFER_UPDATED", entity: "Offer", entityId: offer.id, details: `Updated offer ${offer.title}` },
    });
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    console.error("[/api/admin/offers PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Offer id required" }, { status: 400 });

    await db.offer.delete({ where: { id } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "OFFER_DELETED", entity: "Offer", entityId: id, details: `Deleted offer ${id}` },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/offers DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
