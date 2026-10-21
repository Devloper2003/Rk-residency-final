import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Admin CRUD for OTA-style rate plans (EP / CP / MAP / AP) per room.
 *
 * GET    /api/admin/plans?roomId=...   → { plans } (ALL plans incl. inactive)
 * POST   { roomId, code, name, description?, inclusions[], pricePerNight, sortOrder?, isActive? }
 * PATCH  { id, ...fields }
 * DELETE /api/admin/plans?id=...
 */

const planBody = z.object({
  code: z.string().trim().min(1).max(10),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).optional().nullable(),
  inclusions: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  pricePerNight: z.number().int().min(0).max(1_000_000),
  sortOrder: z.number().int().min(0).max(99).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = new URL(req.url).searchParams.get("roomId");

  // No roomId → all active plans across rooms (used by the day-wise pricing
  // panel in the Inventory tab, which needs a cross-room plan selector).
  if (!roomId) {
    const all = await db.ratePlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { room: { select: { name: true } }, _count: { select: { dayRates: true } } },
    });
    return NextResponse.json({
      plans: all.map(({ room, ...p }) => ({ ...p, roomName: room.name })),
    });
  }

  const plans = await db.ratePlan.findMany({
    where: { roomId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { dayRates: true } } },
  });
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const roomId = String(body?.roomId || "");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });
    const parsed = planBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const room = await db.room.findUnique({ where: { id: roomId }, select: { id: true } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // One plan per code per room keeps the rate table unambiguous.
    const dupe = await db.ratePlan.findFirst({ where: { roomId, code: parsed.data.code } });
    if (dupe) return NextResponse.json({ error: `Plan "${parsed.data.code}" already exists for this room` }, { status: 409 });

    const plan = await db.ratePlan.create({
      data: {
        roomId,
        code: parsed.data.code.toUpperCase(),
        name: parsed.data.name,
        description: parsed.data.description || null,
        inclusions: JSON.stringify(parsed.data.inclusions),
        pricePerNight: parsed.data.pricePerNight,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "RATE_PLAN_CREATED",
        entity: "RatePlan",
        entityId: plan.id,
        details: `${parsed.data.code} — ${parsed.data.name} @ ₹${parsed.data.pricePerNight}/night`,
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error("[/api/admin/plans POST] error:", e);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = planBody.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (typeof parsed.data.code === "string") data.code = parsed.data.code.toUpperCase();
    if (Array.isArray(parsed.data.inclusions)) data.inclusions = JSON.stringify(parsed.data.inclusions);
    delete data.id;
    delete data.roomId;

    const plan = await db.ratePlan.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "RATE_PLAN_UPDATED",
        entity: "RatePlan",
        entityId: id,
        details: `${plan.code} — ₹${plan.pricePerNight}/night, active=${plan.isActive}`,
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error("[/api/admin/plans PATCH] error:", e);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const plan = await db.ratePlan.delete({ where: { id } });
    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "RATE_PLAN_DELETED",
        entity: "RatePlan",
        entityId: id,
        details: `Deleted plan ${plan.code} (${plan.name})`,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/plans DELETE] error:", e);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
