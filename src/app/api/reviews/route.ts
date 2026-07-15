import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { approved: true },
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ reviews });
  } catch (e) {
    console.error("[/api/reviews] error:", e);
    return NextResponse.json({ reviews: [], error: "Failed to load reviews" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  guestName: z.string().min(2).max(120),
  guestLocation: z.string().max(120).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(200),
  body: z.string().min(20).max(2000),
});

/**
 * POST /api/reviews
 * Public endpoint — guests can submit reviews. New reviews are created with
 * `approved: false` and must be moderated by an admin before they appear publicly.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete all required fields.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const review = await db.review.create({
      data: {
        guestName: parsed.data.guestName,
        guestLocation: parsed.data.guestLocation || null,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        source: "DIRECT",
        verified: false,
        approved: false, // Requires admin moderation
      },
    });

    return NextResponse.json({ ok: true, id: review.id });
  } catch (e) {
    console.error("[/api/reviews POST] error:", e);
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
  }
}
