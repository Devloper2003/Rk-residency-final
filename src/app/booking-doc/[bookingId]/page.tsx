import { db } from "@/lib/db";
import { PrintButton } from "../PrintButton";

export const dynamic = "force-dynamic";

/**
 * /booking-doc/[bookingId]?type=voucher
 * /booking-doc/[bookingId]?type=invoice
 *
 * Renders a professional printable HTML page that the user can
 * save as PDF via browser's "Print → Save as PDF" (Ctrl+P / Cmd+P).
 *
 * VOUCHER and INVOICE have completely different layouts:
 *  - Voucher: warm, hospitality-focused, guest-facing confirmation
 *  - Invoice: formal, GST-compliant, accounting-focused tax document
 *
 * The RK Residency logo is embedded as a base64 data URL (loaded from
 * the DB MediaAsset table) so it appears in the printed PDF.
 */
export default async function BookingDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { bookingId } = await params;
  const { type = "voucher" } = await searchParams;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { room: { select: { name: true, view: true, bedType: true, maxGuests: true, sizeSqft: true } } },
  });

  if (!booking) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Booking not found</div>;
  }

  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["brand_name", "brand_tagline", "phone_primary", "email_primary", "address_full", "gstin", "website_url", "logo_image_url"] } },
    select: { key: true, value: true },
  });
  const cfg: Record<string, string> = {};
  settings.forEach((s) => { cfg[s.key] = s.value; });
  cfg.brand_name = cfg.brand_name || "RK Residency";
  cfg.brand_tagline = cfg.brand_tagline || "Heritage Luxury in Vrindavan";
  cfg.phone_primary = cfg.phone_primary || "+91 565 234 5678";
  cfg.email_primary = cfg.email_primary || "reservations@rkresidencyvrindavan.in";
  cfg.address_full = cfg.address_full || "Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121";
  cfg.website_url = cfg.website_url || "www.rkresidencyvrindavan.in";
  cfg.gstin = cfg.gstin || "—";

  // Load logo from DB MediaAsset and convert to base64 data URL for inline embedding.
  // This makes the logo appear in the printed PDF (external URLs would break print).
  let logoDataUrl = "";
  if (cfg.logo_image_url) {
    const match = cfg.logo_image_url.match(/\/uploads\/(.+)$/);
    if (match) {
      try {
        const asset = await db.mediaAsset.findUnique({
          where: { filename: match[1] },
          select: { data: true, mimeType: true },
        });
        if (asset) {
          const base64 = Buffer.from(asset.data).toString("base64");
          logoDataUrl = `data:${asset.mimeType};base64,${base64}`;
        }
      } catch (e) {
        // Logo load failure is non-fatal — fall back to text-only brand name.
        console.error("[booking-doc] logo load failed:", e);
      }
    }
  }

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const isInvoice = type === "invoice";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{isInvoice ? "TAX INVOICE" : "BOOKING VOUCHER"} — {booking.referenceCode}</title>
        <style dangerouslySetInnerHTML={{ __html: SHARED_CSS }} />
      </head>
      <body>
        <PrintButton />
        {isInvoice ? (
          <InvoiceLayout booking={booking} cfg={cfg} logoDataUrl={logoDataUrl} fmt={fmt} />
        ) : (
          <VoucherLayout booking={booking} cfg={cfg} logoDataUrl={logoDataUrl} fmt={fmt} />
        )}
      </body>
    </html>
  );
}

// ─── Shared CSS (used by both layouts) ────────────────────────────────

const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; background: #f5f2ed; color: #231F1C; padding: 20px; }
  .doc { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0E4C4F, #0A3A3C); padding: 24px 36px; display: flex; justify-content: space-between; align-items: center; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header .logo { width: 48px; height: 48px; border-radius: 8px; object-fit: contain; background: #fff; padding: 4px; }
  .header .brand { color: #D4A056; font-size: 22px; font-weight: bold; line-height: 1.1; }
  .header .tagline { color: #FAF8F5; opacity: 0.7; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }
  .header .doc-type { color: #fff; font-size: 18px; font-weight: bold; text-align: right; }
  .header .doc-date { color: rgba(255,255,255,0.6); font-size: 11px; text-align: right; margin-top: 4px; }
  .gold-line { height: 3px; background: #D4A056; }
  .body { padding: 28px 36px; }
  .label { color: #0E4C4F; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
  .value { color: #231F1C; font-size: 14px; font-weight: bold; margin-top: 3px; }
  .section-title { color: #0E4C4F; font-size: 12px; font-weight: bold; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #E5E0D8; text-transform: uppercase; letter-spacing: 1px; }
  .footer { background: #0E4C4F; padding: 18px 36px; text-align: center; }
  .footer .name { color: #D4A056; font-size: 13px; font-weight: bold; }
  .footer .addr { color: rgba(255,255,255,0.7); font-size: 10px; margin-top: 4px; }
  .footer .contact { color: #D4A056; font-size: 11px; margin-top: 5px; }
  .footer .gstin { color: rgba(255,255,255,0.5); font-size: 9px; margin-top: 4px; }
  @media print { body { padding: 0; background: #fff; } .doc { box-shadow: none; border-radius: 0; max-width: 100%; } }
`;

// ─── Voucher Layout (warm, hospitality-focused) ───────────────────────

function VoucherLayout({ booking, cfg, logoDataUrl, fmt }: {
  booking: any; cfg: Record<string, string>; logoDataUrl: string; fmt: (d: Date) => string;
}) {
  return (
    <div className="doc">
      {/* Header with logo */}
      <div className="header">
        <div className="header-left">
          {logoDataUrl && <img className="logo" src={logoDataUrl} alt="Logo" />}
          <div>
            <div className="brand">{cfg.brand_name}</div>
            <div className="tagline">{cfg.brand_tagline}</div>
          </div>
        </div>
        <div>
          <div className="doc-type">BOOKING VOUCHER</div>
          <div className="doc-date">{fmt(new Date())}</div>
        </div>
      </div>
      <div className="gold-line" />

      <div className="body">
        {/* Reference + Status strip */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, padding: "14px 18px", background: "#FAF8F5", borderRadius: 8, border: "1px solid #E5E0D8" }}>
          <div>
            <div className="label">Booking Reference</div>
            <div className="value" style={{ color: "#0E4C4F", fontSize: 18 }}>{booking.referenceCode}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Booking Date</div>
            <div className="value" style={{ fontSize: 13 }}>{fmt(booking.createdAt)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label">Status</div>
            <div className="value" style={{ color: booking.status === "CANCELLED" ? "#C2410C" : "#0E4C4F" }}>
              {booking.status.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div style={{ background: "#0A3A3C", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 6, marginBottom: 24, fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>
          STATUS: {booking.status.replace(/_/g, " ")}  ·  PAYMENT: {booking.paymentStatus}
        </div>

        {/* Guest + Stay side-by-side */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, background: "#FAF8F5", borderRadius: 8, padding: 16, border: "1px solid #E5E0D8" }}>
            <div className="section-title">GUEST DETAILS</div>
            <div style={{ fontSize: 12, lineHeight: 1.9 }}>
              <div><span style={{ color: "#6B6560" }}>Name:</span> <strong>{booking.guestName}</strong></div>
              <div><span style={{ color: "#6B6560" }}>Email:</span> {booking.guestEmail}</div>
              <div><span style={{ color: "#6B6560" }}>Phone:</span> {booking.guestPhone}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "#FAF8F5", borderRadius: 8, padding: 16, border: "1px solid #E5E0D8" }}>
            <div className="section-title">STAY DETAILS</div>
            <div style={{ fontSize: 12, lineHeight: 1.9 }}>
              <div><span style={{ color: "#6B6560" }}>Room:</span> <strong>{booking.room.name}</strong></div>
              <div><span style={{ color: "#6B6560" }}>Check-in:</span> {fmt(booking.checkIn)} (after 2 PM)</div>
              <div><span style={{ color: "#6B6560" }}>Check-out:</span> {fmt(booking.checkOut)} (before 11 AM)</div>
              <div><span style={{ color: "#6B6560" }}>Duration:</span> {booking.nights} night(s) · {booking.adults} Adult(s){booking.children > 0 ? `, ${booking.children} Child(ren)` : ""}</div>
            </div>
          </div>
        </div>

        {/* Charges */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">CHARGES SUMMARY</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#0E4C4F", color: "#fff" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Description</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #f0ede8" }}>Room Tariff ({booking.nights} × Rs. {booking.pricePerNight.toLocaleString("en-IN")})</td><td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #f0ede8", fontWeight: 600 }}>Rs. {booking.subtotal.toLocaleString("en-IN")}</td></tr>
              <tr style={{ background: "#FAF8F5" }}><td style={{ padding: "8px 12px", borderBottom: "1px solid #f0ede8" }}>GST (5%)</td><td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #f0ede8", fontWeight: 600 }}>Rs. {booking.taxesGst.toLocaleString("en-IN")}</td></tr>
              <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #f0ede8" }}>Service Fee</td><td style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #f0ede8", fontWeight: 600 }}>Rs. {booking.serviceFee.toLocaleString("en-IN")}</td></tr>
              <tr style={{ background: "#D4A056" }}><td style={{ padding: "10px 12px", fontSize: 14, fontWeight: "bold" }}>GRAND TOTAL</td><td style={{ padding: "10px 12px", textAlign: "right", fontSize: 14, fontWeight: "bold" }}>Rs. {booking.totalAmount.toLocaleString("en-IN")}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 11, color: "#6B6560" }}>
            Payment Status: <strong style={{ color: booking.paymentStatus === "PAID" ? "#0E4C4F" : "#B8860B" }}>{booking.paymentStatus}</strong>
            <span style={{ marginLeft: 16 }}>Method: {booking.paymentMethod || "N/A"}</span>
          </div>
        </div>

        {/* Inclusions */}
        <div style={{ background: "#FAF8F5", borderRadius: 8, padding: 14, marginBottom: 24, border: "1px solid #D4A056" }}>
          <div style={{ color: "#0E4C4F", fontSize: 11, fontWeight: "bold", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Inclusions</div>
          <div style={{ fontSize: 11, color: "#231F1C", lineHeight: 1.6 }}>
             Wi-Fi, daily housekeeping, assistance with temple visits, and all applicable taxes.
          </div>
        </div>

        {/* Special requests */}
        {booking.specialRequests && (
          <div style={{ background: "#FFF8E7", borderRadius: 8, padding: 14, marginBottom: 24, border: "1px solid #D4A056" }}>
            <div style={{ color: "#B8860B", fontSize: 11, fontWeight: "bold", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Special Requests</div>
            <div style={{ fontSize: 11, color: "#231F1C" }}>{booking.specialRequests}</div>
          </div>
        )}

        {/* Cancellation policy */}
        <div style={{ background: "#FBF1F1", borderRadius: 8, padding: 14, marginBottom: 24, border: "1px solid #C2410C" }}>
          <div style={{ color: "#C2410C", fontSize: 11, fontWeight: "bold", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Cancellation Policy</div>
          <div style={{ fontSize: 11, color: "#231F1C", lineHeight: 1.6 }}>
            Free cancellation until 7 days before check-in. 50% refund for cancellations 3-6 days before. No refund for cancellations within 48 hours of check-in.
          </div>
        </div>

        {/* Thank you note */}
        <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #E5E0D8" }}>
          <div style={{ color: "#0E4C4F", fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>
            Dear {booking.guestName.split(" ")[0]}, thank you for choosing {cfg.brand_name}.
          </div>
          <div style={{ fontSize: 11, color: "#6B6560", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
            Please present this voucher at the front desk upon arrival, along with a government-issued photo ID for each guest. Our concierge will assist with your luggage, temple tour bookings, and any special arrangements you may need during your stay in the holy land of Vrindavan.
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="name">{cfg.brand_name}</div>
        <div className="addr">{cfg.address_full}</div>
        <div className="contact">{cfg.phone_primary}  ·  {cfg.email_primary}  ·  {cfg.website_url}</div>
        {cfg.gstin && cfg.gstin !== "—" && <div className="gstin">GSTIN: {cfg.gstin}</div>}
      </div>
    </div>
  );
}

// ─── Invoice Layout (formal, GST-compliant) ───────────────────────────

function InvoiceLayout({ booking, cfg, logoDataUrl, fmt }: {
  booking: any; cfg: Record<string, string>; logoDataUrl: string; fmt: (d: Date) => string;
}) {
  const cgst = Math.floor(booking.taxesGst / 2);
  const sgst = booking.taxesGst - cgst;
  const invNo = `INV-${booking.referenceCode.split("-").slice(-2).join("-")}`;
  const amountPaid = booking.paymentStatus === "PAID" ? booking.totalAmount : 0;
  const balance = booking.totalAmount - amountPaid;

  return (
    <div className="doc">
      {/* Header with logo */}
      <div className="header">
        <div className="header-left">
          {logoDataUrl && <img className="logo" src={logoDataUrl} alt="Logo" />}
          <div>
            <div className="brand">{cfg.brand_name}</div>
            <div className="tagline">{cfg.brand_tagline}</div>
          </div>
        </div>
        <div>
          <div className="doc-type">TAX INVOICE</div>
          <div className="doc-date">{fmt(booking.createdAt)}</div>
        </div>
      </div>
      <div className="gold-line" />

      <div className="body">
        {/* Invoice meta strip — 4 columns */}
        <div style={{ display: "flex", marginBottom: 20, background: "#FAF8F5", borderRadius: 8, border: "1px solid #E5E0D8", padding: "12px 16px" }}>
          <div style={{ flex: 1, borderRight: "1px solid #E5E0D8", paddingRight: 12 }}>
            <div className="label">Invoice No.</div>
            <div className="value" style={{ color: "#0E4C4F" }}>{invNo}</div>
          </div>
          <div style={{ flex: 1, borderRight: "1px solid #E5E0D8", paddingRight: 12, paddingLeft: 12 }}>
            <div className="label">Invoice Date</div>
            <div className="value" style={{ fontSize: 13 }}>{fmt(booking.createdAt)}</div>
          </div>
          <div style={{ flex: 1, borderRight: "1px solid #E5E0D8", paddingRight: 12, paddingLeft: 12 }}>
            <div className="label">Booking Ref.</div>
            <div className="value" style={{ fontSize: 13 }}>{booking.referenceCode}</div>
          </div>
          <div style={{ flex: 1, paddingLeft: 12 }}>
            <div className="label">GSTIN</div>
            <div className="value" style={{ fontSize: 13 }}>{cfg.gstin}</div>
          </div>
        </div>

        {/* Billed From / Billed To */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #E5E0D8" }}>
            <div className="label" style={{ marginBottom: 8 }}>Billed From</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#0E4C4F", marginBottom: 6 }}>{cfg.brand_name}</div>
            <div style={{ fontSize: 11, color: "#231F1C", lineHeight: 1.7 }}>
              {cfg.address_full}<br />
              Tel: {cfg.phone_primary}<br />
              Email: {cfg.email_primary}<br />
              GSTIN: {cfg.gstin}
            </div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #E5E0D8" }}>
            <div className="label" style={{ marginBottom: 8 }}>Billed To</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#0E4C4F", marginBottom: 6 }}>{booking.guestName}</div>
            <div style={{ fontSize: 11, color: "#231F1C", lineHeight: 1.7 }}>
              Tel: {booking.guestPhone}<br />
              Email: {booking.guestEmail}
            </div>
          </div>
        </div>

        {/* Line items table — proper GST format */}
        <div style={{ marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #0E4C4F" }}>
            <thead>
              <tr style={{ background: "#0E4C4F", color: "#fff" }}>
                <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, width: "5%" }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Description</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, width: "12%" }}>HSN/SAC</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, width: "10%" }}>Qty</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, width: "16%" }}>Rate</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, width: "16%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px", textAlign: "center", borderBottom: "1px solid #f0ede8" }}>1</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #f0ede8" }}>
                  <div style={{ fontWeight: 600 }}>{booking.room.name}</div>
                  <div style={{ fontSize: 10, color: "#6B6560", marginTop: 2 }}>Room tariff @ Rs. {booking.pricePerNight.toLocaleString("en-IN")}/night, {booking.nights} night(s)</div>
                </td>
                <td style={{ padding: "10px", textAlign: "center", borderBottom: "1px solid #f0ede8" }}>996331</td>
                <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>{booking.nights} N</td>
                <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>Rs. {booking.pricePerNight.toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #f0ede8", fontWeight: 600 }}>Rs. {booking.subtotal.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: "#FAF8F5" }}>
                <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#0E4C4F" }}>Subtotal (Taxable Value)</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#0E4C4F" }}>Rs. {booking.subtotal.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>CGST @ 2.5%</td>
                <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>Rs. {cgst.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>SGST @ 2.5%</td>
                <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>Rs. {sgst.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>Service Fee</td>
                <td style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #f0ede8" }}>Rs. {booking.serviceFee.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: "#0A3A3C", color: "#D4A056" }}>
                <td colSpan={4} style={{ padding: "10px", fontWeight: "bold", fontSize: 13 }}>GRAND TOTAL</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>{booking.nights} N</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", fontSize: 13 }}>Rs. {booking.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        <div style={{ background: "#FAF8F5", borderRadius: 6, padding: "10px 14px", marginBottom: 20, border: "1px solid #E5E0D8", fontSize: 11 }}>
          <span style={{ color: "#6B6560", fontWeight: "bold" }}>GRAND TOTAL (IN WORDS): </span>
          <span style={{ color: "#0E4C4F", fontWeight: "bold" }}>Rupees {amountInWords(booking.totalAmount)} Only</span>
        </div>

        {/* Payment status */}
        <div style={{ marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #0E4C4F" }}>
            <thead>
              <tr style={{ background: "#0E4C4F", color: "#fff" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Payment Status</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Amount Paid</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Balance Due</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{booking.paymentStatus}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>Rs. {amountPaid.toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#C2410C", fontWeight: 600 }}>Rs. {balance.toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#0E4C4F", fontWeight: 600 }}>Rs. {booking.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank details + Signatory */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #E5E0D8" }}>
            <div className="label" style={{ marginBottom: 8, color: "#0E4C4F" }}>Bank Details (for balance payment)</div>
            <div style={{ fontSize: 11, color: "#231F1C", lineHeight: 1.8 }}>
              Beneficiary: {cfg.brand_name} <br />
              Bank: Punjab National Bank, Rajpur-Vrindavan (Mathura), U.P.<br />
              A/C No: 0378102100000965<br />
              IFSC:  PUNB0037810<br />
              UPI: 8954289824m@pnb
            </div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #E5E0D8" }}>
            <div className="label" style={{ marginBottom: 8, color: "#0E4C4F" }}>Authorised Signatory</div>
            <div style={{ fontSize: 11, color: "#6B6560", marginTop: 40, fontStyle: "italic" }}>For {cfg.brand_name}</div>
            <div style={{ fontSize: 11, color: "#231F1C", fontWeight: "bold", marginTop: 4 }}>_________________________</div>
            <div style={{ fontSize: 11, color: "#231F1C", marginTop: 2 }}>Front Office Manager</div>
          </div>
        </div>

        {/* Terms & conditions */}
        <div style={{ fontSize: 10, color: "#6B6560", lineHeight: 1.7, borderTop: "1px solid #E5E0D8", paddingTop: 12 }}>
          <div style={{ fontWeight: "bold", color: "#C2410C", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Terms &amp; Conditions</div>
          1. Computer-generated tax invoice — valid without signature.&nbsp;&nbsp;2. GST shown as per applicable rates; any change in tax law will be levied extra.<br />
          3. Cancellation charges apply as per the booking voucher policy.&nbsp;&nbsp;4. Check-in: 2:00 PM onwards · Check-out: before 11:00 AM.<br />
          5. All disputes are subject to Vrindavan / Mathura jurisdiction only.
        </div>
      </div>

      <div className="footer">
        <div className="name">{cfg.brand_name}</div>
        <div className="addr">{cfg.address_full}</div>
        <div className="contact">{cfg.phone_primary}  ·  {cfg.email_primary}  ·  {cfg.website_url}</div>
        {cfg.gstin && cfg.gstin !== "—" && <div className="gstin">GSTIN: {cfg.gstin}</div>}
      </div>
    </div>
  );
}

// ─── Helper: amount in words ──────────────────────────────────────────

function amountInWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  const three = (n: number) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let s = h > 0 ? ones[h] + " Hundred" : "";
    if (r > 0) s += (s ? " " : "") + two(r);
    return s;
  };
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rem = num % 1000;
  const parts: string[] = [];
  if (crore) parts.push(three(crore) + " Crore");
  if (lakh) parts.push(two(lakh) + " Lakh");
  if (thousand) parts.push(two(thousand) + " Thousand");
  if (rem) parts.push(three(rem));
  return parts.join(" ");
}
