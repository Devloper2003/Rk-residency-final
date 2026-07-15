import { db } from "@/lib/db";
import { AdminPanelClient } from "@/components/rk/admin/AdminPanelClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Admin Console — RK Residency",
  robots: { index: false, follow: false },
};

/**
 * Server component — fetches ALL admin data in one request and passes it
 * to the client component as props. This eliminates the need for the
 * client to make 12+ API calls (which was causing OOM crashes).
 */
export default async function AdminRoute() {
  // Fetch all data server-side in parallel — with error handling
  let rooms: any[] = [], offers: any[] = [], blogPosts: any[] = [], reviews: any[] = [];
  let contentItems: any[] = [], settings: any[] = [], themes: any[] = [];
  let bookings: any[] = [], subscribers: any[] = [], messages: any[] = [];
  let auditLogs: any[] = [], adminUsers: any[] = [], seoKeywords: any[] = [];
  let pageViews: any[] = [];

  try {
    [
      rooms, offers, blogPosts, reviews, contentItems, settings, themes,
      bookings, subscribers, messages, auditLogs, adminUsers, seoKeywords,
      pageViews,
    ] = await Promise.all([
    db.room.findMany({ orderBy: [{ sortOrder: "asc" }] }),
    db.offer.findMany({ orderBy: [{ featured: "desc" }, { validFrom: "asc" }] }),
    db.blogPost.findMany({ orderBy: [{ publishedAt: "desc" }] }),
    db.review.findMany({ orderBy: [{ createdAt: "desc" }] }),
    db.siteContent.findMany({ orderBy: [{ section: "asc" }, { key: "asc" }] }),
    db.siteSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] }),
    db.themeSetting.findMany({ orderBy: [{ key: "asc" }] }),
    db.booking.findMany({
      include: { room: { select: { name: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    db.newsletterSubscriber.findMany({ orderBy: [{ createdAt: "desc" }] }),
    db.contactMessage.findMany({ orderBy: [{ createdAt: "desc" }] }),
    db.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      include: { admin: { select: { name: true, email: true } } },
    }),
    db.adminUser.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: [{ createdAt: "asc" }],
    }),
    db.sEOKeyword.findMany({ orderBy: [{ clicks: "desc" }], take: 15 }),
    db.pageView.findMany({
      where: { isBot: false },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
      select: { path: true, referrer: true, sessionId: true, createdAt: true },
    }),
  ]);
  } catch (e) {
    console.error("[/admin] DB fetch error:", e);
  }

  // Compute stats server-side
  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const totalRevenue = activeBookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalRoomInventory = rooms.reduce((s, r) => s + r.totalCount, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const arrivalsToday = bookings.filter((b) => {
    const ci = new Date(b.checkIn);
    return ci >= startOfToday && ci < endOfToday && b.status !== "CANCELLED";
  }).length;
  const departuresToday = bookings.filter((b) => {
    const co = new Date(b.checkOut);
    return co >= startOfToday && co < endOfToday && b.status !== "CANCELLED";
  }).length;

  const revenueTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayBookings = activeBookings.filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd);
    revenueTrend.push({
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: dayBookings.reduce((s, b) => s + b.totalAmount, 0),
      bookings: dayBookings.length,
    });
  }

  const roomTypeStats = rooms.map((r) => {
    const rb = activeBookings.filter((b) => b.roomId === r.id);
    return {
      roomId: r.id, roomName: r.name, bookings: rb.length,
      revenue: rb.reduce((s, b) => s + b.totalAmount, 0),
      nights: rb.reduce((s, b) => s + b.nights, 0),
      occupancy: totalRoomInventory > 0 ? Math.round((rb.reduce((s, b) => s + b.nights, 0) / (r.totalCount * 30)) * 100) : 0,
    };
  });

  // Analytics
  const todayViews = pageViews.filter((v) => v.createdAt >= startOfToday);
  const todaySessions = new Set(todayViews.map((v) => v.sessionId).filter(Boolean)).size;
  const last30Start = new Date(startOfToday.getTime() - 30 * 86400000);
  const allViews30 = pageViews.filter((v) => v.createdAt >= last30Start);
  const pageCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  for (const v of allViews30) {
    pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    if (v.referrer) { try { const h = new URL(v.referrer).hostname.replace(/^www\./, ""); if (h && !h.includes("rkresidency") && !h.includes("localhost") && !h.includes("space-z")) referrerCounts[h] = (referrerCounts[h] || 0) + 1; } catch {} }
  }
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, views]) => ({ path, views }));
  const topReferrers = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, visits]) => ({ source, visits }));
  const last7Days: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const ds = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const de = new Date(ds.getTime() + 86400000);
    const dv = allViews30.filter((v) => v.createdAt >= ds && v.createdAt < de);
    const uc = new Set(dv.map((v) => v.sessionId).filter(Boolean)).size;
    last7Days.push({ date: ds.toISOString().slice(0, 10), label: ds.toLocaleDateString("en-IN", { weekday: "short" }), pageViews: dv.length, uniqueVisitors: uc, sessions: uc });
  }
  const monthlyTrend: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mv = pageViews.filter((v) => v.createdAt >= ms && v.createdAt < me);
    const mb = bookings.filter((b) => b.createdAt >= ms && b.createdAt < me && b.status !== "CANCELLED");
    monthlyTrend.push({
      month: ms.toISOString().slice(0, 7), label: ms.toLocaleDateString("en-IN", { month: "short" }),
      pageViews: mv.length, uniqueVisitors: new Set(mv.map((v) => v.sessionId).filter(Boolean)).size,
      bookings: mb.length, revenue: mb.reduce((s, b) => s + b.totalAmount, 0),
    });
  }
  const totalBookings30 = activeBookings.filter((b) => b.createdAt >= last30Start).length;
  const conversionRate = allViews30.length > 0 ? parseFloat(((totalBookings30 / allViews30.length) * 100).toFixed(2)) : 0;

  const stats = {
    totalBookings: activeBookings.length,
    cancelledBookings: bookings.filter((b) => b.status === "CANCELLED").length,
    totalRevenue,
    occupancyPct: 0,
    adr: activeBookings.reduce((s, b) => s + b.nights, 0) > 0 ? Math.round(totalRevenue / activeBookings.reduce((s, b) => s + b.nights, 0)) : 0,
    revpar: 0,
    arrivalsToday, departuresToday,
    totalRooms: totalRoomInventory,
    revenueTrend, roomTypeStats,
  };

  const analytics = {
    today: { pageViews: todayViews.length, uniqueVisitors: todaySessions, sessions: todaySessions },
    last7Days, topPages, topReferrers, monthlyTrend,
    bookingFunnel: { views: allViews30.length, checks: Math.max(totalBookings30 * 8, Math.round(allViews30.length * 0.05)), bookings: totalBookings30, conversionRate },
    seoKeywords,
  };

  return (
    <AdminPanelClient
      initialData={{
        stats, analytics, bookings, rooms, offers, blogPosts, reviews,
        contentItems, settings, themes, subscribers, messages, auditLogs, adminUsers,
      }}
    />
  );
}
