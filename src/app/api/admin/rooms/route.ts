import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rooms = await db.room.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return NextResponse.json({ rooms });
}

const roomSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  basePrice: z.number().int().min(0),
  maxGuests: z.number().int().min(1),
  sizeSqft: z.number().int().min(1),
  bedType: z.string().min(1),
  view: z.string().min(1),
  imageUrls: z.string(),
  amenities: z.string(),
  totalCount: z.number().int().min(1),
  badge: z.string().nullable(),
  featured: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid room data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const room = await db.room.create({
      data: {
        slug: d.slug, name: d.name, tagline: d.tagline, description: d.description,
        longDescription: d.longDescription, basePrice: d.basePrice, maxGuests: d.maxGuests,
        sizeSqft: d.sizeSqft, bedType: d.bedType, view: d.view, imageUrls: d.imageUrls,
        amenities: d.amenities, totalCount: d.totalCount, badge: d.badge,
        featured: d.featured, sortOrder: d.sortOrder,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "ROOM_CREATED", entity: "Room", entityId: room.id, details: `Created room ${room.name}` },
    });
    return NextResponse.json({ ok: true, room });
  } catch (e) {
    console.error("[/api/admin/rooms POST] error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid room data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (!d.id) return NextResponse.json({ error: "Room id required for update" }, { status: 400 });

    const room = await db.room.update({
      where: { id: d.id },
      data: {
        slug: d.slug, name: d.name, tagline: d.tagline, description: d.description,
        longDescription: d.longDescription, basePrice: d.basePrice, maxGuests: d.maxGuests,
        sizeSqft: d.sizeSqft, bedType: d.bedType, view: d.view, imageUrls: d.imageUrls,
        amenities: d.amenities, totalCount: d.totalCount, badge: d.badge,
        featured: d.featured, sortOrder: d.sortOrder,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "ROOM_UPDATED", entity: "Room", entityId: room.id, details: `Updated room ${room.name} (price ₹${room.basePrice})` },
    });
    return NextResponse.json({ ok: true, room });
  } catch (e) {
    console.error("[/api/admin/rooms PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Room id required" }, { status: 400 });

    await db.room.delete({ where: { id } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "ROOM_DELETED", entity: "Room", entityId: id, details: `Deleted room ${id}` },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/rooms DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
