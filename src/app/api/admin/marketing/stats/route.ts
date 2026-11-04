import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Marketing Hub — performance snapshot (READ-ONLY, zero writes).
 *
 * GET /api/admin/marketing/stats
 *   → real numbers from the live DB so marketing decisions sit on facts:
 *     • last-30-day bookings + revenue (marketing output, not all-time)
 *     • newsletter audience size
 *     • loyalty coupons: total, active, redeemed
 *     • reviews (approved) and leads (contact messages) waiting
 *     • avg lead time (days between booking date and check-in) for 30d bookings
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);

    const [bookings30d, subscribers, couponsTotal, couponsActive, couponsUsed, reviewsApproved, leadsTotal, leadsRecent] =
      await Promise.all([
        db.booking.findMany({
          where: { createdAt: { gte: d30 }, status: { not: "CANCELLED" } },
          select: { totalAmount: true, checkIn: true, createdAt: true },
        }),
        db.newsletterSubscriber.count(),
        db.discountCode.count(),
        db.discountCode.count({ where: { isActive: true, validUntil: { gte: now } } }),
        db.discountCode.count({ where: { usedAt: { not: null } } }),
        db.review.count({ where: { approved: true } }),
        db.contactMessage.count(),
        db.contactMessage.count({ where: { createdAt: { gte: d30 } } }),
      ]);

    const revenue30d = bookings30d.reduce((s, b) => s + b.totalAmount, 0);
    const leadTimes = bookings30d
      .map((b) => (b.checkIn.getTime() - b.createdAt.getTime()) / 86400000)
      .filter((d) => d >= 0);
    const avgLeadDays = leadTimes.length
      ? Math.round((leadTimes.reduce((s, d) => s + d, 0) / leadTimes.length) * 10) / 10
      : 0;

    return NextResponse.json({
      last30: {
        bookings: bookings30d.length,
        revenue: revenue30d,
        avgLeadDays,
      },
      audience: {
        newsletterSubscribers: subscribers,
        reviewsApproved: reviewsApproved,
      },
      coupons: { total: couponsTotal, active: couponsActive, redeemed: couponsUsed },
      leads: { total: leadsTotal, last30: leadsRecent },
      generatedAt: now.toISOString(),
    });
  } catch (e) {
    console.error("[/api/admin/marketing/stats GET] error:", e);
    return NextResponse.json({ error: "Failed to load marketing stats" }, { status: 500 });
  }
}
