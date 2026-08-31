import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Generate a readable coupon code like RK-5OFF-A7X3K2 */
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `RK-5OFF-${rand(6)}`;
}

/**
 * POST /api/booking-confirmation
 * Called after a successful booking to:
 *  1. Auto-generate a 5% discount coupon for the guest's next booking
 *  2. Send a professional confirmation email with voucher, invoice, bank details & coupon card
 */
export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    /* ───── 1. Fetch booking ───── */
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { select: { name: true } },
      },
    });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    /* ───── 2. Fetch email settings ───── */
    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: [
            "email_api_key",
            "email_from",
            "email_provider",
            "email_admin_notify",
            "bank_account_name",
            "bank_account_number",
            "bank_ifsc",
            "bank_upi_id",
          ],
        },
      },
      select: { key: true, value: true },
    });
    const cfg: Record<string, string> = {};
    settings.forEach((s) => {
      cfg[s.key] = s.value;
    });

    const apiKey = cfg.email_api_key;
    const fromEmail = cfg.email_from || "bookings@rkresidencyvrindavan.in";
    const provider = cfg.email_provider || "resend";
    const adminNotify = cfg.email_admin_notify || "true";

    /* ───── 3. Auto-generate 5% coupon ───── */
    const couponCode = generateCouponCode();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 90); // valid for 90 days

    let couponCreated = false;
    try {
      await db.discountCode.create({
        data: {
          code: couponCode,
          discountPct: 5,
          createdByBooking: booking.id,
          createdByGuest: booking.guestEmail,
          validUntil,
          isActive: true,
        },
      });
      couponCreated = true;
      console.log("[coupon] Created:", couponCode, "for", booking.guestEmail);
    } catch (err) {
      console.error("[coupon] Create failed:", err);
      // Don't fail the whole request — coupon is bonus
    }

    /* ───── 4. Send email (if API key exists) ───── */
    if (!apiKey) {
      console.log("[booking-confirmation] No email API key — skipping");
      return NextResponse.json({
        ok: true,
        emailSent: false,
        couponCreated,
        couponCode: couponCreated ? couponCode : undefined,
        reason: "no_api_key",
      });
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    const nights = booking.nights || 1;
    const subtotal = booking.subtotal || booking.totalAmount;
    const gstAmount = booking.totalAmount - subtotal;

    /* ───── Guest email HTML ───── */
    const guestHtml = `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FAF8F5;border-radius:16px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0E4C4F,#0A3A3C);padding:32px;text-align:center;">
    <h1 style="color:#D4A056;font-size:28px;margin:0;letter-spacing:1px;">RK Residency</h1>
    <p style="color:#FAF8F5;opacity:0.7;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Vrindavan · Braj</p>
  </div>

  <!-- Confirmed badge -->
  <div style="text-align:center;padding:24px 32px 0;">
    <div style="display:inline-block;background:#E8F5E9;color:#2E7D32;padding:8px 24px;border-radius:20px;font-size:14px;font-weight:600;">Booking Confirmed</div>
  </div>

  <div style="padding:24px 32px 32px;">

    <!-- Greeting -->
    <h2 style="color:#231F1C;font-size:22px;margin-top:0;">Dear ${booking.guestName},</h2>
    <p style="color:#6B6560;font-size:15px;line-height:1.6;">Your reservation at <strong>RK Residency, Vrindavan</strong> is confirmed. We look forward to welcoming you.</p>

    <!-- ── VOUCHER CARD ── -->
    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin:20px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#D4A056;font-weight:700;margin-bottom:14px;">Booking Voucher</div>

      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Reference</span>
        <span style="color:#0E4C4F;font-weight:bold;font-size:15px;">${booking.referenceCode}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Room</span>
        <span style="color:#231F1C;font-size:14px;">${booking.room.name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Check-in</span>
        <span style="color:#231F1C;font-size:14px;">${fmt(new Date(booking.checkIn))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Check-out</span>
        <span style="color:#231F1C;font-size:14px;">${fmt(new Date(booking.checkOut))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Guests</span>
        <span style="color:#231F1C;font-size:14px;">${booking.adults} Adults${booking.children > 0 ? `, ${booking.children} Children` : ""}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Nights</span>
        <span style="color:#231F1C;font-size:14px;">${nights}</span>
      </div>

      <div style="border-top:1px solid #E5E0D8;margin-top:12px;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#6B6560;font-size:13px;">Subtotal</span>
          <span style="color:#231F1C;font-size:14px;">₹${subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#6B6560;font-size:13px;">GST (18%)</span>
          <span style="color:#231F1C;font-size:14px;">₹${gstAmount.toLocaleString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="color:#231F1C;font-weight:bold;font-size:16px;">Total</span>
          <span style="color:#0E4C4F;font-weight:bold;font-size:20px;">₹${booking.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div style="text-align:right;margin-top:8px;">
        <span style="color:${booking.paymentStatus === "PAID" ? "#2E7D32" : "#D4A056"};font-size:12px;font-weight:600;background:${booking.paymentStatus === "PAID" ? "#E8F5E9" : "#FFF8E1"};padding:4px 12px;border-radius:10px;">${booking.paymentStatus}</span>
      </div>
    </div>

    <!-- ── INVOICE SECTION ── -->
    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin:20px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#D4A056;font-weight:700;margin-bottom:14px;">Invoice Details</div>
      <div style="margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Guest:</span>
        <span style="color:#231F1C;font-size:14px;margin-left:8px;">${booking.guestName}</span>
      </div>
      <div style="margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Email:</span>
        <span style="color:#231F1C;font-size:14px;margin-left:8px;">${booking.guestEmail}</span>
      </div>
      <div style="margin-bottom:10px;">
        <span style="color:#6B6560;font-size:13px;">Phone:</span>
        <span style="color:#231F1C;font-size:14px;margin-left:8px;">${booking.guestPhone}</span>
      </div>
      <div>
        <span style="color:#6B6560;font-size:13px;">Payment Method:</span>
        <span style="color:#231F1C;font-size:14px;margin-left:8px;">${booking.paymentMethod || "N/A"}</span>
      </div>
    </div>

    <!-- ── BANK DETAILS ── -->
    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin:20px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#D4A056;font-weight:700;margin-bottom:14px;">Bank Details (for offline payment)</div>
      ${cfg.bank_account_name ? `
      <div style="margin-bottom:8px;"><span style="color:#6B6560;font-size:13px;">Account Name:</span><br><span style="color:#231F1C;font-size:14px;font-weight:600;">${cfg.bank_account_name}</span></div>` : ""}
      ${cfg.bank_account_number ? `
      <div style="margin-bottom:8px;"><span style="color:#6B6560;font-size:13px;">Account No:</span><br><span style="color:#231F1C;font-size:14px;font-weight:600;">${cfg.bank_account_number}</span></div>` : ""}
      ${cfg.bank_ifsc ? `
      <div style="margin-bottom:8px;"><span style="color:#6B6560;font-size:13px;">IFSC Code:</span><br><span style="color:#231F1C;font-size:14px;font-weight:600;">${cfg.bank_ifsc}</span></div>` : ""}
      ${cfg.bank_upi_id ? `
      <div><span style="color:#6B6560;font-size:13px;">UPI ID:</span><br><span style="color:#231F1C;font-size:14px;font-weight:600;">${cfg.bank_upi_id}</span></div>` : ""}
      ${!cfg.bank_account_name && !cfg.bank_upi_id ? `<p style="color:#999;font-size:13px;">Bank details not configured yet. Contact us for payment info.</p>` : ""}
    </div>

    <!-- ── COUPON CARD ── -->
    ${couponCreated ? `
    <div style="background:linear-gradient(135deg,#FFF8E1,#FFF3CD);border:2px dashed #D4A056;border-radius:12px;padding:20px;margin:20px 0;text-align:center;position:relative;">
      <div style="position:absolute;top:-1px;right:-1px;background:#D4A056;color:#fff;font-size:10px;font-weight:700;padding:4px 12px;border-radius:0 10px 0 10px;text-transform:uppercase;letter-spacing:1px;">Gift</div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#8D6E3F;margin-bottom:8px;">Your Exclusive Coupon</div>
      <div style="font-size:13px;color:#6B5B3E;margin-bottom:12px;">Thank you for booking with us! Enjoy <strong>5% OFF</strong> on your next stay.</div>
      <div style="background:#fff;border-radius:8px;padding:14px 20px;display:inline-block;border:1px solid #E5D5B5;">
        <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;color:#0E4C4F;letter-spacing:3px;">${couponCode}</div>
      </div>
      <div style="font-size:11px;color:#8D6E3F;margin-top:10px;">Valid for 90 days · One-time use · Non-transferable</div>
      <div style="font-size:11px;color:#8D6E3F;">Apply at checkout on your next booking</div>
    </div>` : ""}

        <!-- ── DOWNLOAD LINKS ── -->
    <div style="display:flex;gap:12px;justify-content:center;margin:24px 0 8px;">
      <a href="https://rkresidencyvrindavan.in/api/invoice/${booking.referenceCode}" style="display:inline-flex;align-items:center;gap:6px;background:#0E4C4F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">&#128196; Download Invoice</a>
      <a href="https://rkresidencyvrindavan.in/api/voucher/${booking.referenceCode}" style="display:inline-flex;align-items:center;gap:6px;background:#D4A056;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">&#127942; Download Voucher</a>
    </div>
    <p style="text-align:center;font-size:11px;color:#999;margin:0 0 16px;">Click to view & save PDF</p>
    <!-- Footer -->
    <p style="color:#6B6560;font-size:13px;line-height:1.6;margin-top:24px;">For any queries, contact us at <strong>+91 9760814931</strong> or reply to this email.</p>
    <p style="color:#6B6560;font-size:13px;font-style:italic;">Atithi Devo Bhava.</p>

  </div>

  <!-- Bottom bar -->
  <div style="background:#0E4C4F;padding:16px;text-align:center;">
    <p style="color:#FAF8F5;opacity:0.6;font-size:11px;margin:0;">RK Residency, Vrindavan · www.rkresidencyvrindavan.in</p>
  </div>

</div>`;

    /* ───── Admin notification HTML ───── */
    const adminHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#0E4C4F;">New Booking — ${booking.referenceCode}</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Guest</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.guestName}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestEmail}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestPhone}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Room</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.room.name}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Dates</td><td style="padding:8px;border-bottom:1px solid #eee;">${fmt(new Date(booking.checkIn))} → ${fmt(new Date(booking.checkOut))}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Nights</td><td style="padding:8px;border-bottom:1px solid #eee;">${nights}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">₹${booking.totalAmount.toLocaleString("en-IN")}</td></tr>
    <tr><td style="padding:8px;color:#666;">Payment</td><td style="padding:8px;">${booking.paymentStatus} (${booking.paymentMethod || "N/A"})</td></tr>
  </table>
  ${couponCreated ? `<p style="margin-top:12px;color:#2E7D32;font-size:13px;">Coupon generated: <strong>${couponCode}</strong></p>` : ""}
  <p style="margin-top:16px;"><a href="https://rkresidencyvrindavan.in/admin" style="background:#0E4C4F;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">View in Admin</a></p>
</div>`;

    /* ───── 5. Send emails via Resend ───── */
    let emailSent = false;

    if (provider === "resend" && apiKey) {
      // Guest email
      const guestRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `RK Residency <${fromEmail}>`,
          to: [booking.guestEmail],
          subject: `Booking Confirmed — ${booking.referenceCode} | RK Residency Vrindavan`,
          html: guestHtml,
        }),
      });
      if (guestRes.ok) {
        emailSent = true;
        console.log("[email] Guest email sent to", booking.guestEmail);
      } else {
        console.error("[email] Guest email failed:", await guestRes.text());
      }

      // Admin email
      if (adminNotify === "true") {
        const adminRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `RK Residency <${fromEmail}>`,
            to: [fromEmail],
            subject: `New Booking — ${booking.referenceCode} | ${booking.guestName}`,
            html: adminHtml,
          }),
        });
        if (adminRes.ok) {
          console.log("[email] Admin notification sent");
        } else {
          console.error("[email] Admin email failed:", await adminRes.text());
        }
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      couponCreated,
      couponCode: couponCreated ? couponCode : undefined,
      reference: booking.referenceCode,
    });
  } catch (e) {
    console.error("[booking-confirmation] error:", e);
    return NextResponse.json({
      ok: true,
      emailSent: false,
      couponCreated: false,
      error: "Email/coupon failed but booking confirmed",
    });
  }
}
