import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(6).max(30),
  date: z.string().datetime(),
  tourType: z.enum(["TEMPLE_CIRCUIT", "WALKING_YATRA", "YAMUNA_BOAT", "GUIDED_FULL_DAY"]),
  guests: z.number().int().min(1).max(20),
  language: z.enum(["ENGLISH", "HINDI"]).default("ENGLISH"),
  specialRequests: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * POST /api/tour-booking
 * Public endpoint for booking a temple tour.
 * Creates a ContactMessage with topic "TOUR_BOOKING" for the admin to follow up.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const tourLabels: Record<string, string> = {
      TEMPLE_CIRCUIT: "Private Temple Circuit (AC car, ₹2,500/day)",
      WALKING_YATRA: "Guided Walking Yatra (₹1,200/session)",
      YAMUNA_BOAT: "Yamuna Boat + Aarti (₹1,500/person)",
      GUIDED_FULL_DAY: "Full-Day Guided Braj Tour (₹4,500/day)",
    };

    await db.contactMessage.create({
      data: {
        name: d.name,
        email: d.email.toLowerCase(),
        phone: d.phone,
        subject: `Temple Tour Booking: ${tourLabels[d.tourType]} on ${new Date(d.date).toLocaleDateString("en-IN")}`,
        message: `Tour: ${tourLabels[d.tourType]}\nDate: ${new Date(d.date).toLocaleDateString("en-IN")}\nGuests: ${d.guests}\nLanguage: ${d.language}\n\nSpecial requests: ${d.specialRequests || "None"}`,
        topic: "BOOKING",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/tour-booking] error:", e);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
