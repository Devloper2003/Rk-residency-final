import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/track
 * Body: { path, referrer, sessionId }
 * Records a page view for analytics. Non-blocking — always returns 200.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || "/";
    const referrer = body.referrer || null;
    const sessionId = body.sessionId || null;
    const userAgent = req.headers.get("user-agent") || null;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || null;
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent || "");

    await db.pageView.create({
      data: {
        path,
        referrer,
        userAgent,
        ipAddress,
        sessionId,
        isBot,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Silently fail — tracking should never break the page
    console.error("[/api/track] error:", e);
    return NextResponse.json({ ok: true });
  }
}
