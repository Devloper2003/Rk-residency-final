import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCronOrAdmin } from "@/lib/cron-auth";
import { revalidatePostPaths } from "@/lib/blog-publish";
import { sweepBookings } from "@/lib/booking-sync";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/publish-posts — the hourly scheduler.
 *
 * Protected by CRON_SECRET (Vercel Cron sends `Authorization: Bearer
 * <CRON_SECRET>`; configure it in Vercel → Settings → Environment
 * Variables). The owner's admin session is also accepted so "Run scheduler
 * now" in the admin panel can trigger the same run on demand.
 *
 * What it does:
 *   1. Publishes every SCHEDULED post whose publishOn time is due
 *      (status → PUBLISHED, published = true, publishedAt = publishOn).
 *      It also self-heals legacy rows still stuck at the pre-migration
 *      default status with published=true.
 *   2. Revalidates the blog list, each published post page, the homepage
 *      latest-posts section and the sitemap.
 *
 * A post with a FUTURE publishOn date is never touched here and never
 * appears in the blog list, the sitemap or the public HTML (the public
 * queries filter on published + publishedAt <= now).
 */
async function runScheduler() {
  const now = new Date();

  // 1) Publish due scheduled posts.
  const due = await db.blogPost.findMany({
    where: { status: "SCHEDULED", publishOn: { lte: now } },
    select: { id: true, slug: true, publishOn: true },
  });
  let publishedNow = 0;
  for (const post of due) {
    await db.blogPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        published: true,
        publishedAt: post.publishOn || now,
      },
    });
    publishedNow++;
  }

  // 1b) Self-heal pre-migration rows: published=true but status still at the
  // column default. Makes the owner's existing posts fully consistent even
  // if scripts/migrate-blog-status.ts has not been run yet.
  const legacy = await db.blogPost.findMany({
    where: { published: true, status: { not: "PUBLISHED" }, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
    select: { id: true },
  });
  for (const post of legacy) {
    await db.blogPost.update({ where: { id: post.id }, data: { status: "PUBLISHED" } });
  }

  // 2) Revalidate the surfaces that show posts.
  for (const post of due) {
    revalidatePostPaths(post.slug);
  }
  if (due.length === 0) revalidatePostPaths();

  // 3) Booking payment lifecycle sweep — auto-cancel abandoned gateway
  // sessions + reconcile pending Razorpay orders (daily safety net; real-time
  // correctness comes from the webhook + admin panel loads).
  let bookingSweep = { cancelled: 0, reconciledPaid: 0, skipped: false };
  try {
    bookingSweep = await sweepBookings();
  } catch (e) {
    console.error("[/api/cron/publish-posts] booking sweep failed:", e);
  }

  return { ok: true, publishedNow, healedLegacy: legacy.length, bookingSweep, at: now.toISOString() };
}

export async function GET(req: Request) {
  const auth = await verifyCronOrAdmin(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runScheduler());
  } catch (e) {
    console.error("[/api/cron/publish-posts] error:", e);
    return NextResponse.json({ error: "Scheduler failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
