import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().max(160),
  name: z.string().max(120).optional(),
  language: z.enum(["en", "hi"]).default("en"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { ok: true, alreadySubscribed: true, message: "You are already subscribed." },
        { status: 200 }
      );
    }

    await db.newsletterSubscriber.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
        language: parsed.data.language,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/newsletter] error:", e);
    return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 500 });
  }
}
