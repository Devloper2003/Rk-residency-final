import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(30).optional().or(z.literal("")),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(4000),
  topic: z.enum(["GENERAL", "BOOKING", "EVENTS", "PRESS"]).default("GENERAL"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete all required fields.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        topic: parsed.data.topic,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/contact] error:", e);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
