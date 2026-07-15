import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings
 * Query params: status, search, limit, offset
 * Returns full booking list (admin view) with room + guest info.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { referenceCode: { contains: search } },
        { guestName: { contains: search } },
        { guestEmail: { contains: search } },
        { guestPhone: { contains: search } },
      ];
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: { room: { select: { name: true, slug: true } } },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total });
  } catch (e) {
    console.error("[/api/admin/bookings] error:", e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string(),
  action: z.enum(["CONFIRM", "CHECK_IN", "CHECK_OUT", "CANCEL", "MARK_PAID", "REFUND"]),
});

/**
 * PATCH /api/admin/bookings
 * Body: { id, action }
 * Updates booking status / payment status + writes audit log.
 */
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { id, action } = parsed.data;
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    let update: Record<string, unknown> = {};
    let logAction = "";
    let logDetails = "";

    switch (action) {
      case "CONFIRM":
        update = { status: "CONFIRMED" };
        logAction = "BOOKING_CONFIRMED";
        logDetails = `Booking ${booking.referenceCode} confirmed`;
        break;
      case "CHECK_IN":
        update = { status: "CHECKED_IN" };
        logAction = "BOOKING_CHECKED_IN";
        logDetails = `Guest checked in for ${booking.referenceCode}`;
        break;
      case "CHECK_OUT":
        update = { status: "CHECKED_OUT" };
        logAction = "BOOKING_CHECKED_OUT";
        logDetails = `Guest checked out for ${booking.referenceCode}`;
        break;
      case "CANCEL":
        update = { status: "CANCELLED" };
        logAction = "BOOKING_CANCELLED";
        logDetails = `Booking ${booking.referenceCode} cancelled`;
        break;
      case "MARK_PAID":
        update = { paymentStatus: "PAID" };
        logAction = "BOOKING_MARKED_PAID";
        logDetails = `Payment marked as PAID for ${booking.referenceCode}`;
        break;
      case "REFUND":
        update = { paymentStatus: "REFUNDED" };
        logAction = "BOOKING_REFUNDED";
        logDetails = `Refund issued for ${booking.referenceCode}`;
        break;
    }

    const updated = await db.booking.update({ where: { id }, data: update });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: logAction,
        entity: "Booking",
        entityId: booking.id,
        details: logDetails,
      },
    });

    return NextResponse.json({ ok: true, booking: updated });
  } catch (e) {
    console.error("[/api/admin/bookings PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
