import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics
 * Returns visitor + SEO analytics — optimized to use minimal DB queries.
 *
 * Strategy: fetch all page views for last 30 days in ONE query, then compute
 * all the daily/monthly breakdowns in JavaScript. This avoids 40+ separate
 * Prisma queries that OOM the sandbox.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30Start = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    // === SINGLE QUERY: all page views for last 30 days ===
    const allViews = await db.pageView.findMany({
      where: { createdAt: { gte: last30Start }, isBot: false },
      select: { path: true, referrer: true, sessionId: true, createdAt: true },
    });

    // === Compute today's stats ===
    const todayViews = allViews.filter((v) => v.createdAt >= startOfToday);
    const todaySessions = new Set(todayViews.map((v) => v.sessionId).filter(Boolean)).size;

    // === Compute last 7 days breakdown ===
    const last7Days: Array<{ date: string; label: string; pageViews: number; uniqueVisitors: number; sessions: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayViews = allViews.filter((v) => v.createdAt >= dayStart && v.createdAt < dayEnd);
      const uniqueCount = new Set(dayViews.map((v) => v.sessionId).filter(Boolean)).size;
      last7Days.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        pageViews: dayViews.length,
        uniqueVisitors: uniqueCount,
        sessions: uniqueCount,
      });
    }

    // === Compute top pages + referrers (from allViews) ===
    const pageCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    for (const v of allViews) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          const host = url.hostname.replace(/^www\./, "");
          if (host && !host.includes("rkresidency") && !host.includes("localhost") && !host.includes("space-z")) {
            referrerCounts[host] = (referrerCounts[host] || 0) + 1;
          }
        } catch {}
      }
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([source, visits]) => ({ source, visits }));

    // === Monthly trend (last 6 months) — single booking query + compute views from allViews ===
    // Note: allViews only covers 30 days, so for 6-month trend we need a separate query
    // But to keep memory low, we'll just count page views per month with count() queries
    const monthlyTrend: Array<{ month: string; label: string; pageViews: number; uniqueVisitors: number; bookings: number; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      // Only query if this month is within the last 30 days (to reuse allViews)
      // Otherwise do a lightweight count query
      let views: number;
      let uniqueCount: number;
      if (monthStart >= last30Start) {
        // Within our 30-day window — use allViews
        const monthViews = allViews.filter((v) => v.createdAt >= monthStart && v.createdAt < monthEnd);
        views = monthViews.length;
        uniqueCount = new Set(monthViews.map((v) => v.sessionId).filter(Boolean)).size;
      } else {
        // Older month — lightweight count (no findMany)
        views = await db.pageView.count({
          where: { createdAt: { gte: monthStart, lt: monthEnd }, isBot: false },
        });
        uniqueCount = views; // Approximate (can't get unique without findMany)
      }
      const bookings = await db.booking.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { not: "CANCELLED" } },
      });
      const revenueAgg = await db.booking.aggregate({
        where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      });
      monthlyTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        label: monthStart.toLocaleDateString("en-IN", { month: "short" }),
        pageViews: views,
        uniqueVisitors: uniqueCount,
        bookings,
        revenue: revenueAgg._sum.totalAmount || 0,
      });
    }

    // === Booking funnel (last 30 days) ===
    const totalViews = allViews.length;
    const totalBookings = await db.booking.count({
      where: { createdAt: { gte: last30Start }, status: { not: "CANCELLED" } },
    });
    const estimatedChecks = Math.max(totalBookings * 8, Math.round(totalViews * 0.05));
    const conversionRate = totalViews > 0 ? parseFloat(((totalBookings / totalViews) * 100).toFixed(2)) : 0;

    // === SEO keywords ===
    const seoKeywords = await db.sEOKeyword.findMany({
      orderBy: [{ clicks: "desc" }],
      take: 15,
    });

    return NextResponse.json({
      today: { pageViews: todayViews.length, uniqueVisitors: todaySessions, sessions: todaySessions },
      last7Days,
      topPages,
      topReferrers,
      monthlyTrend,
      bookingFunnel: {
        views: totalViews,
        checks: estimatedChecks,
        bookings: totalBookings,
        conversionRate,
      },
      seoKeywords,
    });
  } catch (e) {
    console.error("[/api/admin/analytics] error:", e);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
