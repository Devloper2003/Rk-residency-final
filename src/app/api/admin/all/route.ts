import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/all?action=XXX
 * Consolidated admin GET endpoint — handles all admin read operations in one
 * compiled route file to reduce Turbopack compilation pressure.
 *
 * Actions: stats, analytics, bookings, rooms, offers, blog, reviews, content,
 * settings, theme, users, data (leads/messages/audit)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "ALL";

  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    switch (action) {
      case "stats": {
        const allBookings = await db.booking.findMany({
          where: { status: { not: "CANCELLED" } },
          include: { room: true },
        });
        const totalBookings = allBookings.length;
        const cancelledBookings = await db.booking.count({ where: { status: "CANCELLED" } });
        const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const bookedRoomNights = allBookings.reduce((sum, b) => sum + b.nights, 0);
        const totalRooms = await db.room.aggregate({ _sum: { totalCount: true } });
        const totalRoomInventory = totalRooms._sum.totalCount || 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday.getTime() + 86400000);
        const next30 = new Date(now.getTime() + 30 * 86400000);
        const bookedRoomNights30d = allBookings
          .filter((b) => new Date(b.checkOut) > now && new Date(b.checkIn) < next30)
          .reduce((sum, b) => {
            const start = new Date(Math.max(new Date(b.checkIn).getTime(), now.getTime()));
            const end = new Date(Math.min(new Date(b.checkOut).getTime(), next30.getTime()));
            return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
          }, 0);
        const occupancyPct = totalRoomInventory > 0 ? Math.round((bookedRoomNights30d / (totalRoomInventory * 30)) * 100) : 0;
        const adr = bookedRoomNights > 0 ? Math.round(totalRevenue / bookedRoomNights) : 0;
        const revpar = totalRoomInventory > 0 ? Math.round(totalRevenue / (totalRoomInventory * 30)) : 0;
        const arrivalsToday = await db.booking.count({ where: { checkIn: { gte: startOfToday, lt: endOfToday }, status: { not: "CANCELLED" } } });
        const departuresToday = await db.booking.count({ where: { checkOut: { gte: startOfToday, lt: endOfToday }, status: { not: "CANCELLED" } } });
        const revenueTrend: any[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const dayEnd = new Date(dayStart.getTime() + 86400000);
          const dayBookings = allBookings.filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd);
          revenueTrend.push({
            date: dayStart.toISOString().slice(0, 10),
            label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
            revenue: dayBookings.reduce((s, b) => s + b.totalAmount, 0),
            bookings: dayBookings.length,
          });
        }
        const rooms = await db.room.findMany();
        const roomTypeStats = rooms.map((r) => {
          const roomBookings = allBookings.filter((b) => b.roomId === r.id);
          return {
            roomId: r.id, roomName: r.name, bookings: roomBookings.length,
            revenue: roomBookings.reduce((s, b) => s + b.totalAmount, 0),
            nights: roomBookings.reduce((s, b) => s + b.nights, 0),
            occupancy: totalRoomInventory > 0 ? Math.round((roomBookings.reduce((s, b) => s + b.nights, 0) / (r.totalCount * 30)) * 100) : 0,
          };
        });
        return NextResponse.json({ totalBookings, cancelledBookings, totalRevenue, occupancyPct, adr, revpar, arrivalsToday, departuresToday, totalRooms: totalRoomInventory, revenueTrend, roomTypeStats });
      }

      case "analytics": {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last30Start = new Date(startOfToday.getTime() - 30 * 86400000);
        const allViews = await db.pageView.findMany({
          where: { createdAt: { gte: last30Start }, isBot: false },
          select: { path: true, referrer: true, sessionId: true, createdAt: true },
        });
        const todayViews = allViews.filter((v) => v.createdAt >= startOfToday);
        const todaySessions = new Set(todayViews.map((v) => v.sessionId).filter(Boolean)).size;
        const last7Days: any[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const dayEnd = new Date(dayStart.getTime() + 86400000);
          const dayViews = allViews.filter((v) => v.createdAt >= dayStart && v.createdAt < dayEnd);
          const uniqueCount = new Set(dayViews.map((v) => v.sessionId).filter(Boolean)).size;
          last7Days.push({ date: dayStart.toISOString().slice(0, 10), label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }), pageViews: dayViews.length, uniqueVisitors: uniqueCount, sessions: uniqueCount });
        }
        const pageCounts: Record<string, number> = {};
        const referrerCounts: Record<string, number> = {};
        for (const v of allViews) {
          pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
          if (v.referrer) { try { const host = new URL(v.referrer).hostname.replace(/^www\./, ""); if (host && !host.includes("rkresidency") && !host.includes("localhost") && !host.includes("space-z")) referrerCounts[host] = (referrerCounts[host] || 0) + 1; } catch {} }
        }
        const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, views]) => ({ path, views }));
        const topReferrers = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, visits]) => ({ source, visits }));
        const monthlyTrend: any[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          let views: number, uniqueCount: number;
          if (monthStart >= last30Start) {
            const monthViews = allViews.filter((v) => v.createdAt >= monthStart && v.createdAt < monthEnd);
            views = monthViews.length; uniqueCount = new Set(monthViews.map((v) => v.sessionId).filter(Boolean)).size;
          } else {
            views = await db.pageView.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, isBot: false } });
            uniqueCount = views;
          }
          const bookings = await db.booking.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { not: "CANCELLED" } } });
          const revenueAgg = await db.booking.aggregate({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { not: "CANCELLED" } }, _sum: { totalAmount: true } });
          monthlyTrend.push({ month: monthStart.toISOString().slice(0, 7), label: monthStart.toLocaleDateString("en-IN", { month: "short" }), pageViews: views, uniqueVisitors: uniqueCount, bookings, revenue: revenueAgg._sum.totalAmount || 0 });
        }
        const totalBookings = await db.booking.count({ where: { createdAt: { gte: last30Start }, status: { not: "CANCELLED" } } });
        const conversionRate = allViews.length > 0 ? parseFloat(((totalBookings / allViews.length) * 100).toFixed(2)) : 0;
        const seoKeywords = await db.sEOKeyword.findMany({ orderBy: [{ clicks: "desc" }], take: 15 });
        return NextResponse.json({
          today: { pageViews: todayViews.length, uniqueVisitors: todaySessions, sessions: todaySessions },
          last7Days, topPages, topReferrers, monthlyTrend,
          bookingFunnel: { views: allViews.length, checks: Math.max(totalBookings * 8, Math.round(allViews.length * 0.05)), bookings: totalBookings, conversionRate },
          seoKeywords,
        });
      }

      case "bookings": {
        const where: any = {};
        if (status !== "ALL") where.status = status;
        if (search) { where.OR = [{ referenceCode: { contains: search } }, { guestName: { contains: search } }, { guestEmail: { contains: search } }, { guestPhone: { contains: search } }]; }
        const [bookings, total] = await Promise.all([
          db.booking.findMany({ where, include: { room: { select: { name: true, slug: true } } }, orderBy: [{ createdAt: "desc" }], take: 100 }),
          db.booking.count({ where }),
        ]);
        return NextResponse.json({ bookings, total });
      }

      case "rooms": {
        const rooms = await db.room.findMany({ orderBy: [{ sortOrder: "asc" }] });
        return NextResponse.json({ rooms });
      }

      case "offers": {
        const offers = await db.offer.findMany({ orderBy: [{ featured: "desc" }, { validFrom: "asc" }] });
        return NextResponse.json({ offers });
      }

      case "blog": {
        const posts = await db.blogPost.findMany({ orderBy: [{ publishedAt: "desc" }] });
        return NextResponse.json({ posts });
      }

      case "reviews": {
        const reviews = await db.review.findMany({ orderBy: [{ createdAt: "desc" }] });
        return NextResponse.json({ reviews });
      }

      case "content": {
        const items = await db.siteContent.findMany({ orderBy: [{ section: "asc" }, { key: "asc" }] });
        return NextResponse.json({ items });
      }

      case "settings": {
        const settings = await db.siteSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
        return NextResponse.json({ settings });
      }

      case "theme": {
        const themes = await db.themeSetting.findMany({ orderBy: [{ key: "asc" }] });
        return NextResponse.json({ themes });
      }

      case "users": {
        if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const users = await db.adminUser.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: [{ createdAt: "asc" }] });
        return NextResponse.json({ users });
      }

      case "data": {
        const [subscribers, messages, auditLogs] = await Promise.all([
          db.newsletterSubscriber.findMany({ orderBy: [{ createdAt: "desc" }] }),
          db.contactMessage.findMany({ orderBy: [{ createdAt: "desc" }] }),
          db.auditLog.findMany({ orderBy: [{ createdAt: "desc" }], take: 100, include: { admin: { select: { name: true, email: true } } } }),
        ]);
        return NextResponse.json({ subscribers, messages, auditLogs });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[/api/admin/all GET]", action, e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/all
 * Body: { action: "XXX", ...payload }
 * Consolidated admin PATCH endpoint.
 *
 * Actions: booking_status, content, setting, theme, review, room, offer, blog_post
 */
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case "booking_status": {
        const { id, bookingAction } = body as { id: string; bookingAction: string };
        const booking = await db.booking.findUnique({ where: { id } });
        if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const updates: Record<string, string> = {};
        let logAction = "";
        switch (bookingAction) {
          case "CHECK_IN": updates.status = "CHECKED_IN"; logAction = "BOOKING_CHECKED_IN"; break;
          case "CHECK_OUT": updates.status = "CHECKED_OUT"; logAction = "BOOKING_CHECKED_OUT"; break;
          case "CANCEL": updates.status = "CANCELLED"; logAction = "BOOKING_CANCELLED"; break;
          case "MARK_PAID": updates.paymentStatus = "PAID"; logAction = "BOOKING_MARKED_PAID"; break;
          case "REFUND": updates.paymentStatus = "REFUNDED"; logAction = "BOOKING_REFUNDED"; break;
          default: return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        const updated = await db.booking.update({ where: { id }, data: updates });
        await db.auditLog.create({ data: { adminId: admin.id, action: logAction, entity: "Booking", entityId: booking.id, details: `${bookingAction} for ${booking.referenceCode}` } });
        return NextResponse.json({ ok: true, booking: updated });
      }

      case "content": {
        const { id, value } = body as { id: string; value: string };
        const item = await db.siteContent.update({ where: { id }, data: { value } });
        await db.auditLog.create({ data: { adminId: admin.id, action: "CONTENT_UPDATED", entity: "SiteContent", entityId: item.id, details: `Updated "${item.key}"` } });
        return NextResponse.json({ ok: true, item });
      }

      case "setting": {
        const { id, value } = body as { id: string; value: string };
        const setting = await db.siteSetting.update({ where: { id }, data: { value } });
        await db.auditLog.create({ data: { adminId: admin.id, action: "SETTING_UPDATED", entity: "SiteSetting", entityId: setting.id, details: `Updated "${setting.key}"` } });
        return NextResponse.json({ ok: true, setting });
      }

      case "theme": {
        const { id, value } = body as { id: string; value: string };
        const theme = await db.themeSetting.update({ where: { id }, data: { value } });
        await db.auditLog.create({ data: { adminId: admin.id, action: "THEME_UPDATED", entity: "ThemeSetting", entityId: theme.id, details: `Updated ${theme.key} = ${value}` } });
        return NextResponse.json({ ok: true, theme });
      }

      case "review": {
        const { id, reviewAction } = body as { id: string; reviewAction: "APPROVE" | "HIDE" };
        const review = await db.review.update({ where: { id }, data: { approved: reviewAction === "APPROVE" } });
        await db.auditLog.create({ data: { adminId: admin.id, action: reviewAction === "APPROVE" ? "REVIEW_APPROVED" : "REVIEW_HIDDEN", entity: "Review", entityId: review.id, details: `Review "${review.title}"` } });
        return NextResponse.json({ ok: true, review });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[/api/admin/all PATCH]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
