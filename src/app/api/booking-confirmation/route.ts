import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/booking-confirmation
 * Called after a successful booking to send confirmation email.
 *
 * Uses the Resend API (https://resend.com) — free tier: 100 emails/day.
 * The API key is stored as a site setting 'email_api_key' (set via admin).
 *
 * If no API key is configured, the email is skipped (no error).
 * The booking still succeeds — email is a bonus, not a requirement.
 */
export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { name: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const settings = await db.siteSetting.findMany({
      where: { key: { in: ["email_api_key", "email_from", "email_provider", "email_admin_notify"] } },
      select: { key: true, value: true },
    });
    const config: Record<string, string> = {};
    settings.forEach((s) => { config[s.key] = s.value; });

    const apiKey = config.email_api_key;
    const fromEmail = config.email_from || "bookings@rkresidencyvrindavan.in";
    const provider = config.email_provider || "resend";
    const adminNotify = config.email_admin_notify || "true";

    if (!apiKey) {
      console.log("[booking-confirmation] No email API key — skipping");
      return NextResponse.json({ ok: true, emailSent: false, reason: "no_api_key" });
    }

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    const guestHtml = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FAF8F5;border-radius:16px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#0E4C4F,#0A3A3C);padding:32px;text-align:center;">
<h1 style="color:#D4A056;font-size:28px;margin:0;">RK Residency</h1>
<p style="color:#FAF8F5;opacity:0.7;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Vrindavan · Braj</p>
</div>
<div style="padding:32px;">
<h2 style="color:#231F1C;font-size:22px;">Booking Confirmed! 🙏</h2>
<p style="color:#6B6560;font-size:15px;line-height:1.6;">Dear ${booking.guestName},</p>
<p style="color:#6B6560;font-size:15px;line-height:1.6;">Your reservation at RK Residency is confirmed. We look forward to welcoming you to Vrindavan.</p>
<div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin:20px 0;">
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Reference</span><span style="color:#0E4C4F;font-weight:bold;font-size:15px;">${booking.referenceCode}</span></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Room</span><span style="color:#231F1C;font-size:14px;">${booking.room.name}</span></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Check-in</span><span style="color:#231F1C;font-size:14px;">${fmt(booking.checkIn)}</span></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Check-out</span><span style="color:#231F1C;font-size:14px;">${fmt(booking.checkOut)}</span></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Guests</span><span style="color:#231F1C;font-size:14px;">${booking.adults} Adults${booking.children > 0 ? `, ${booking.children} Children` : ""}</span></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6B6560;font-size:13px;">Nights</span><span style="color:#231F1C;font-size:14px;">${booking.nights}</span></div>
<div style="border-top:1px solid #E5E0D8;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
<span style="color:#231F1C;font-weight:bold;font-size:15px;">Total</span>
<span style="color:#0E4C4F;font-weight:bold;font-size:18px;">₹${booking.totalAmount.toLocaleString("en-IN")}</span></div>
<div style="text-align:right;margin-top:4px;"><span style="color:${booking.paymentStatus === "PAID" ? "#0E4C4F" : "#D4A056"};font-size:12px;font-weight:600;">Payment: ${booking.paymentStatus}</span></div>
</div>
<p style="color:#6B6560;font-size:13px;line-height:1.6;">Contact: +91 9760814931 or reply to this email.</p>
<p style="color:#6B6560;font-size:13px;line-height:1.6;"><em>Atithi Devo Bhava.</em></p>
</div></div>`;

    const adminHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
<h2 style="color:#0E4C4F;">New Booking Alert</h2>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Reference</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.referenceCode}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Guest</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestName}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestEmail}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestPhone}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Room</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.room.name}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Dates</td><td style="padding:8px;border-bottom:1px solid #eee;">${fmt(booking.checkIn)} → ${fmt(booking.checkOut)}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">₹${booking.totalAmount.toLocaleString("en-IN")}</td></tr>
<tr><td style="padding:8px;color:#666;">Payment</td><td style="padding:8px;">${booking.paymentStatus} (${booking.paymentMethod})</td></tr>
</table>
<p style="margin-top:16px;"><a href="https://rkresidencyvrindavan.in/admin" style="background:#0E4C4F;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">View in Admin</a></p>
</div>`;

    let emailSent = false;

    if (provider === "resend" && apiKey) {
      // Send to guest
      const guestRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `RK Residency <${fromEmail}>`,
          to: [booking.guestEmail],
          subject: `Booking Confirmed — ${booking.referenceCode} | RK Residency Vrindavan`,
          html: guestHtml,
        }),
      });
      if (guestRes.ok) { emailSent = true; console.log("[email] Guest email sent to", booking.guestEmail); }
      else { console.error("[email] Guest email failed:", await guestRes.text()); }

      // Send to admin
      if (adminNotify === "true") {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `RK Residency <${fromEmail}>`,
            to: [fromEmail],
            subject: `New Booking — ${booking.referenceCode} | ${booking.guestName}`,
            html: adminHtml,
          }),
        });
        console.log("[email] Admin notification sent");
      }
    }

    return NextResponse.json({ ok: true, emailSent, reference: booking.referenceCode });
  } catch (e) {
    console.error("[booking-confirmation] error:", e);
    return NextResponse.json({ ok: true, emailSent: false, error: "Email failed but booking confirmed" });
  }
}
