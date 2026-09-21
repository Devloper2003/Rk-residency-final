import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/* ─── GET: List all coupons ─── */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // "active" | "used" | "expired" | "all"
    const now = new Date();

    const where: any = {};
    if (status === "active") {
      where.isActive = true;
      where.usedAt = null;
      where.validUntil = { gte: now };
    } else if (status === "used") {
      where.usedAt = { not: null };
    } else if (status === "expired") {
      where.validUntil = { lt: now };
      where.usedAt = null;
    }

    const coupons = await db.discountCode.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        createdByBookingRel: {
          select: { id: true, referenceCode: true, guestName: true },
        },
      },
    });

    // Stats
    const [total, active, used, expired] = await Promise.all([
      db.discountCode.count(),
      db.discountCode.count({ where: { isActive: true, usedAt: null, validUntil: { gte: now } } }),
      db.discountCode.count({ where: { usedAt: { not: null } } }),
      db.discountCode.count({ where: { validUntil: { lt: now }, usedAt: null } }),
    ]);

    return NextResponse.json({ coupons, stats: { total, active, used, expired } });
  } catch (e) {
    console.error("[/api/admin/coupons GET] error:", e);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

/* ─── POST: Create coupon manually ─── */
const createSchema = z.object({
  code: z.string().min(1).max(30).optional(), // auto-generate if empty
  discountPct: z.number().int().min(1).max(100),
  guestEmail: z.string().email().max(160),
  guestName: z.string().max(100).optional(),
  validDays: z.number().int().min(1).max(365).default(10),
  bookingId: z.string().optional(), // optional link to booking
});

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    // Generate code if not provided
    let code = d.code?.trim().toUpperCase();
    if (!code) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      code = `RK${d.discountPct}OFF-${rand(4)}`;
    }

    // Check duplicate
    const existing = await db.discountCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Code "${code}" already exists.` }, { status: 409 });
    }

    // If no bookingId provided, find the most recent booking for this guest
    let bookingId = d.bookingId;
    if (!bookingId) {
      const recentBooking = await db.booking.findFirst({
        where: { guestEmail: d.guestEmail },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!recentBooking) {
        return NextResponse.json({ error: "No booking found for this email. Please provide a booking ID." }, { status: 400 });
      }
      bookingId = recentBooking.id;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + d.validDays);

    const coupon = await db.discountCode.create({
      data: {
        code,
        discountPct: d.discountPct,
        createdByBooking: bookingId,
        createdByGuest: d.guestEmail,
        validUntil,
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "COUPON_CREATED",
        entity: "DiscountCode",
        entityId: coupon.id,
        details: `Created coupon ${code} (${d.discountPct}%) for ${d.guestEmail}`,
      },
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (e) {
    console.error("[/api/admin/coupons POST] error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

/* ─── PATCH: Toggle active / update ─── */
const updateSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;

    const coupon = await db.discountCode.update({
      where: { id: d.id },
      data: {
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "COUPON_UPDATED",
        entity: "DiscountCode",
        entityId: coupon.id,
        details: `Updated coupon ${coupon.code}: isActive=${coupon.isActive}`,
      },
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (e) {
    console.error("[/api/admin/coupons PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/* ─── DELETE: Remove coupon ─── */
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Coupon id required" }, { status: 400 });

    const coupon = await db.discountCode.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "COUPON_DELETED",
        entity: "DiscountCode",
        entityId: id,
        details: `Deleted coupon ${coupon.code}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/coupons DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
