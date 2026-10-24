import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modeLabel, paidAmountOf } from "@/lib/payment-modes";

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
 *  2. Send the confirmation email in the OWNER-APPROVED design (cream page,
 *     gold frame, ॥ श्री राधे ॥ motif, deep-green + gold) — the same design
 *     the voucher/invoice PDFs and the admin panel use, so the guest sees one
 *     consistent document everywhere.
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
        room: { select: { name: true, bedType: true } },
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
            "brand_name",
            "phone_primary",
            "email_primary",
            "address_full",
            "gstin",
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
    const brandName = cfg.brand_name || "RK Residency";
    const phone = cfg.phone_primary || "+91 9760814931";
    const addr = cfg.address_full || "Near Shani Dev Mandir, Kailash Nagar, Vrindavan, Uttar Pradesh 281121";
    const gstin = cfg.gstin || "09GUJPS8343M1ZK";

    const siteBase = (
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.rkresidencyvrindavan.in"
    ).replace(/\/+$/, "");

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
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    const m0 = (n: number) => "\u20B9" + Math.round(n).toLocaleString("en-IN");

    const nights = booking.nights || 1;
    const subtotal = booking.subtotal || booking.totalAmount;
    const gross = Math.round((booking.pricePerNight || 0) * nights);
    const gst = booking.taxesGst || Math.round(subtotal * 0.05);
    const cgst = Math.floor(gst / 2);
    const sgst = gst - cgst;
    const paid = paidAmountOf(booking);
    const balance = Math.max(booking.totalAmount - paid, 0);
    const paidLabel =
      booking.paymentStatus === "PARTIAL" ? "20% ADVANCE RECEIVED" : booking.paymentStatus;
    const plan = (booking.planName || "").toUpperCase();

    /* ───── Guest email HTML — owner-approved design ───── */
    const guestHtml = `
<div style="background:#EDE9DC;padding:20px 8px;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:640px;margin:0 auto;background:#FBF9F1;border:1px solid #B9974C;border-top:4px solid #B9974C;overflow:hidden;">

  <!-- Motif -->
  <div style="text-align:center;padding:18px 24px 0;color:#B9974C;font-size:14px;letter-spacing:1px;">&#0965; &#0936;&#094d;&#0930;&#0940; &#0930;&#093e;&#0927;&#0947; &#0965;</div>

  <!-- Brand + title -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
    <td style="padding:10px 24px 0;vertical-align:middle;">
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#1D5B45;border:1px solid #B9974C;text-align:center;line-height:44px;color:#B9974C;font-size:15px;font-weight:bold;">RK</div>
        </td>
        <td style="vertical-align:middle;">
          <div style="color:#1D5B45;font-size:26px;font-weight:bold;line-height:1;">${brandName}</div>
          <div style="color:#B9974C;font-size:8px;letter-spacing:3px;margin-top:5px;">BOUTIQUE HOTEL &nbsp;&middot;&nbsp; VRINDAVAN</div>
        </td>
      </tr></table>
    </td>
    <td style="padding:10px 24px 0;vertical-align:middle;text-align:right;">
      <div style="color:#22332B;font-size:20px;font-weight:bold;letter-spacing:2px;">BOOKING VOUCHER</div>
      <div style="color:#78756B;font-size:11px;margin-top:5px;">Voucher No. ${booking.referenceCode} &nbsp;&middot;&nbsp; Date ${fmt(new Date())}</div>
      <div style="display:inline-block;border:1px solid #1D5B45;color:#1D5B45;font-size:10px;font-weight:bold;letter-spacing:2px;padding:4px 14px;border-radius:3px;margin-top:7px;">CONFIRMED</div>
    </td>
  </tr></table>

  <!-- Contact line -->
  <div style="padding:12px 24px;color:#78756B;font-size:10.5px;text-align:center;line-height:1.6;">${addr} &middot; Ph: ${phone} &middot; ${cfg.email_primary || "rkresiddency121@gmail.com"} &middot; GSTIN: ${gstin}</div>
  <div style="margin:0 24px;border-top:1px solid #B9974C;"></div>

  <div style="padding:18px 24px 8px;">

    <!-- Greeting -->
    <p style="color:#2A352E;font-size:15px;margin:0 0 14px;">Dear <strong>${booking.guestName}</strong>, your reservation at <strong>${brandName}, Vrindavan</strong> is confirmed. Radhe Radhe!</p>

    <!-- Guest band -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#EFF3E2;">
      <tr>
        <td style="padding:12px 14px;width:45%;">
          <div style="color:#B9974C;font-size:8px;font-weight:bold;letter-spacing:1.6px;">GUEST NAME</div>
          <div style="color:#16493A;font-size:18px;font-weight:bold;margin-top:4px;">${booking.guestName}</div>
        </td>
        <td style="padding:12px 14px;border-left:1px solid #D9E0C5;">
          <div style="color:#B9974C;font-size:8px;font-weight:bold;letter-spacing:1.6px;">CONTACT</div>
          <div style="color:#2A352E;font-size:12px;margin-top:4px;">${booking.guestPhone}</div>
        </td>
        <td style="padding:12px 14px;border-left:1px solid #D9E0C5;">
          <div style="color:#B9974C;font-size:8px;font-weight:bold;letter-spacing:1.6px;">BOOKING ID</div>
          <div style="color:#2A352E;font-size:12px;font-weight:bold;margin-top:4px;">${booking.referenceCode}</div>
        </td>
      </tr>
    </table>

    <!-- Stay details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;color:#2A352E;font-size:12.5px;">
      <tr><td style="padding:4px 0;color:#78756B;width:42%;">Check-in</td><td style="padding:4px 0;font-weight:bold;">${fmt(new Date(booking.checkIn))} &mdash; from 12:00 PM</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">Check-out</td><td style="padding:4px 0;font-weight:bold;">${fmt(new Date(booking.checkOut))} &mdash; till 11:00 AM</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">Room</td><td style="padding:4px 0;font-weight:bold;">${booking.room?.name || "Room"} &nbsp;&middot;&nbsp; ${nights} Night(s)</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">Guests</td><td style="padding:4px 0;font-weight:bold;">${booking.adults} Adults, ${booking.children} Child</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">Meal plan</td><td style="padding:4px 0;font-weight:bold;">${booking.planName || "Room Only"}</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">ID required</td><td style="padding:4px 0;font-weight:bold;">Aadhaar / Passport for every guest</td></tr>
      <tr><td style="padding:4px 0;color:#78756B;">Payment status</td><td style="padding:4px 0;font-weight:bold;color:#1D5B45;">${paidLabel} &nbsp;(${modeLabel(booking.paymentMethod)})</td></tr>
    </table>

    <!-- Money band -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#1D5B45;margin-top:14px;">
      <tr>
        <td style="padding:12px 14px;">
          <div style="color:#CFE0D3;font-size:8px;font-weight:bold;letter-spacing:1.2px;">TOTAL (INCL. GST)</div>
          <div style="color:#ffffff;font-size:19px;font-weight:bold;margin-top:3px;">${m0(booking.totalAmount)}</div>
        </td>
        <td style="padding:12px 14px;border-left:1px solid #3A6E58;">
          <div style="color:#CFE0D3;font-size:8px;font-weight:bold;letter-spacing:1.2px;">ADVANCE RECEIVED</div>
          <div style="color:#ffffff;font-size:19px;font-weight:bold;margin-top:3px;">${m0(paid)}</div>
        </td>
        <td style="padding:12px 14px;border-left:1px solid #3A6E58;">
          <div style="color:#CFE0D3;font-size:8px;font-weight:bold;letter-spacing:1.2px;">BALANCE AT HOTEL</div>
          <div style="color:#ffffff;font-size:19px;font-weight:bold;margin-top:3px;">${m0(balance)}</div>
        </td>
      </tr>
    </table>

    <!-- Invoice summary -->
    <div style="border:1px solid #D9D3BF;padding:14px 16px;margin-top:14px;">
      <div style="color:#B9974C;font-size:9px;font-weight:bold;letter-spacing:1.6px;margin-bottom:8px;">INVOICE SUMMARY</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:12px;color:#57544B;">
        <tr><td style="padding:3px 0;">Room tariff</td><td style="padding:3px 0;text-align:right;color:#2A352E;">${m0(gross)}</td></tr>
        <tr><td style="padding:3px 0;">GST (5%)</td><td style="padding:3px 0;text-align:right;color:#2A352E;">${m0(gst)}</td></tr>
        <tr><td style="padding:3px 0;">CGST + SGST (half each)</td><td style="padding:3px 0;text-align:right;color:#2A352E;">${m0(cgst)} + ${m0(sgst)}</td></tr>
        <tr><td style="padding:7px 0;border-top:1px solid #D9D3BF;margin-top:4px;color:#2A352E;font-weight:bold;font-size:14px;">Total</td><td style="padding:7px 0;border-top:1px solid #D9D3BF;text-align:right;color:#1D5B45;font-weight:bold;font-size:15px;">${"\u20B9"}${booking.totalAmount.toLocaleString("en-IN")}</td></tr>
        ${balance > 0 ? `<tr><td style="padding:3px 0;">Balance due</td><td style="padding:3px 0;text-align:right;color:#2A352E;font-weight:bold;">${m0(balance)}</td></tr>` : ""}
      </table>
    </div>

    ${booking.specialRequests?.trim() ? `
    <!-- Special requests -->
    <div style="margin-top:14px;">
      <div style="color:#B9974C;font-size:9px;font-weight:bold;letter-spacing:1.6px;margin-bottom:5px;">SPECIAL REQUESTS</div>
      <div style="color:#4A473E;font-size:12px;">${booking.specialRequests}</div>
    </div>` : ""}

    <!-- Inclusions -->
    <div style="margin-top:14px;">
      <div style="color:#B9974C;font-size:9px;font-weight:bold;letter-spacing:1.6px;margin-bottom:5px;">INCLUSIONS</div>
      <div style="color:#4A473E;font-size:12px;line-height:1.8;">
        ${plan.includes("CP") || plan.includes("BREAKFAST") ? "&bull; Complimentary breakfast<br>" : ""}&bull; Free Wi-Fi and parking<br>&bull; Housekeeping and 24&times;7 reception
      </div>
    </div>

    <!-- Bank details -->
    ${cfg.bank_account_name || cfg.bank_upi_id ? `
    <div style="border:1px solid #D9D3BF;padding:14px 16px;margin-top:14px;">
      <div style="color:#B9974C;font-size:9px;font-weight:bold;letter-spacing:1.6px;margin-bottom:8px;">BANK DETAILS (FOR BALANCE PAYMENT)</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:12px;color:#4A473E;">
        ${cfg.bank_account_name ? `<tr><td style="padding:2px 0;width:40%;">Account name</td><td style="padding:2px 0;font-weight:bold;">${cfg.bank_account_name}</td></tr>` : ""}
        ${cfg.bank_account_number ? `<tr><td style="padding:2px 0;">Account no.</td><td style="padding:2px 0;font-weight:bold;">${cfg.bank_account_number}</td></tr>` : ""}
        ${cfg.bank_ifsc ? `<tr><td style="padding:2px 0;">IFSC</td><td style="padding:2px 0;font-weight:bold;">${cfg.bank_ifsc}</td></tr>` : ""}
        ${cfg.bank_upi_id ? `<tr><td style="padding:2px 0;">UPI</td><td style="padding:2px 0;font-weight:bold;">${cfg.bank_upi_id}</td></tr>` : ""}
      </table>
    </div>` : ""}

    <!-- Coupon card -->
    ${couponCreated ? `
    <div style="border:2px dashed #B9974C;background:#F7F1DE;padding:16px;text-align:center;margin-top:14px;">
      <div style="color:#8D7439;font-size:9px;font-weight:bold;letter-spacing:1.6px;">YOUR EXCLUSIVE COUPON</div>
      <div style="color:#5C534A;font-size:12px;margin:6px 0 10px;">Thank you for booking with us! Enjoy <strong>5% OFF</strong> on your next stay.</div>
      <div style="background:#FBF9F1;border:1px solid #D9D3BF;display:inline-block;padding:10px 22px;">
        <span style="font-family:'Courier New',monospace;font-size:20px;font-weight:bold;color:#1D5B45;letter-spacing:3px;">${couponCode}</span>
      </div>
      <div style="color:#8D7439;font-size:10.5px;margin-top:8px;">Valid for 90 days &middot; One-time use &middot; Non-transferable</div>
    </div>` : ""}

    <!-- Download buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
      <tr>
        <td align="center" style="padding:2px;">
          <a href="${siteBase}/api/voucher/${booking.referenceCode}" style="display:inline-block;background:#1D5B45;color:#ffffff;text-decoration:none;padding:12px 26px;font-size:13px;font-weight:bold;border-radius:4px;">Download Voucher (PDF)</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:8px 2px 2px;">
          <a href="${siteBase}/api/invoice/${booking.referenceCode}" style="display:inline-block;background:#B9974C;color:#ffffff;text-decoration:none;padding:12px 26px;font-size:13px;font-weight:bold;border-radius:4px;">Download Invoice (PDF)</a>
        </td>
      </tr>
    </table>
    <p style="text-align:center;color:#98948A;font-size:10.5px;margin:8px 0 0;">Same design as this email &mdash; print or show on phone at reception.</p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px 24px 22px;">
    <div style="color:#16493A;font-style:italic;font-size:14px;">Radhe Radhe &ndash; we look forward to welcoming you!</div>
    <div style="color:#98948A;font-size:9.5px;margin-top:8px;">This is a computer-generated voucher &middot; ${brandName}, Vrindavan &middot; www.rkresidencyvrindavan.in</div>
  </div>

</div>
</div>`;

    /* ───── Admin notification HTML ───── */
    const adminHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#1D5B45;">New Booking — ${booking.referenceCode}</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Guest</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.guestName}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestEmail}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.guestPhone}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Room</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.room?.name || "-"}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Dates</td><td style="padding:8px;border-bottom:1px solid #eee;">${fmt(new Date(booking.checkIn))} → ${fmt(new Date(booking.checkOut))}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Nights</td><td style="padding:8px;border-bottom:1px solid #eee;">${nights}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">₹${booking.totalAmount.toLocaleString("en-IN")}</td></tr>
    <tr><td style="padding:8px;color:#666;">Payment</td><td style="padding:8px;">${booking.paymentStatus === "PARTIAL" ? `PARTIAL — ₹${paidAmountOf(booking).toLocaleString("en-IN")} received, ₹${(booking.totalAmount - paidAmountOf(booking)).toLocaleString("en-IN")} due at hotel` : booking.paymentStatus} (${modeLabel(booking.paymentMethod)})</td></tr>
  </table>
  ${couponCreated ? `<p style="margin-top:12px;color:#1D5B45;font-size:13px;">Coupon generated: <strong>${couponCode}</strong></p>` : ""}
  <p style="margin-top:16px;"><a href="${siteBase}/admin" style="background:#1D5B45;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">View in Admin</a></p>
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
