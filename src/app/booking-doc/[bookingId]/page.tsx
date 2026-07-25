import { db } from "@/lib/db";
import { PrintButton } from "../PrintButton";

export const dynamic = "force-dynamic";

/**
 * /booking-doc/[bookingId]?type=voucher
 * /booking-doc/[bookingId]?type=invoice
 *
 * Renders a professional printable HTML page that the user can
 * save as PDF via browser's "Print → Save as PDF" (Ctrl+P / Cmd+P).
 * Works on ALL platforms including Vercel — no PDF library needed.
 *
 * NOTE: This is a Server Component (async DB calls). The PrintButton is
 * a separate Client Component because it uses onClick + window.print().
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
    include: { room: { select: { name: true } } },
  });

  if (!booking) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Booking not found</div>;
  }

  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["brand_name", "brand_tagline", "phone_primary", "email_primary", "address_full", "gstin"] } },
    select: { key: true, value: true },
  });
  const cfg: Record<string, string> = {};
  settings.forEach((s) => { cfg[s.key] = s.value; });

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const isInvoice = type === "invoice";
  const title = isInvoice ? "TAX INVOICE" : "BOOKING VOUCHER";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{title} — {booking.referenceCode}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, 'Times New Roman', serif; background: #f5f2ed; color: #231F1C; padding: 20px; }
          .doc { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0E4C4F, #0A3A3C); padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
          .header .brand { color: #D4A056; font-size: 26px; font-weight: bold; }
          .header .tagline { color: #FAF8F5; opacity: 0.7; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
          .header .doc-type { color: #fff; font-size: 20px; font-weight: bold; text-align: right; }
          .header .doc-date { color: rgba(255,255,255,0.6); font-size: 11px; text-align: right; margin-top: 4px; }
          .gold-line { height: 3px; background: #D4A056; }
          .body { padding: 32px 40px; }
          .ref-bar { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #D4A056; }
          .ref-bar .label { color: #0E4C4F; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .ref-bar .value { color: #231F1C; font-size: 18px; font-weight: bold; margin-top: 4px; }
          .section { margin-bottom: 24px; }
          .section-title { color: #0E4C4F; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
          .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0ede8; }
          .detail-row .lbl { color: #6B6560; font-size: 12px; width: 140px; flex-shrink: 0; }
          .detail-row .val { color: #231F1C; font-size: 13px; font-weight: 600; }
          .payment-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .payment-table th { background: #0E4C4F; color: #fff; padding: 10px 14px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 1px; }
          .payment-table th:last-child { text-align: right; }
          .payment-table td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #f0ede8; }
          .payment-table td:last-child { text-align: right; font-weight: 600; }
          .payment-table tr:nth-child(even) td { background: #FAF8F5; }
          .total-row { background: #D4A056 !important; }
          .total-row td { font-size: 14px !important; font-weight: bold !important; color: #231F1C !important; border: none !important; }
          .pay-status { margin-top: 16px; font-size: 12px; color: #6B6560; }
          .pay-status .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; margin-left: 8px; }
          .pay-status .paid { background: #0E4C4F15; color: #0E4C4F; }
          .pay-status .pending { background: #D4A05620; color: #B8860B; }
          .info-box { background: #FAF8F5; border: 1px solid #E5E0D8; border-radius: 8px; padding: 16px; margin-top: 16px; }
          .info-box ul { list-style: none; }
          .info-box li { font-size: 11px; color: #6B6560; padding: 4px 0; padding-left: 16px; position: relative; }
          .info-box li:before { content: "•"; color: #D4A056; position: absolute; left: 0; font-weight: bold; }
          .gst-info { margin-top: 16px; padding-top: 12px; border-top: 1px solid #E5E0D8; font-size: 10px; color: #6B6560; text-align: center; }
          .footer { background: #0E4C4F; padding: 20px 40px; text-align: center; }
          .footer .name { color: #D4A056; font-size: 14px; font-weight: bold; }
          .footer .addr { color: rgba(255,255,255,0.7); font-size: 10px; margin-top: 4px; }
          .footer .contact { color: #D4A056; font-size: 11px; margin-top: 6px; }
          .print-btn { position: fixed; top: 20px; right: 20px; z-index: 100; background: #0E4C4F; color: #fff; border: none; padding: 12px 24px; border-radius: 30px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: Arial, sans-serif; }
          .print-btn:hover { background: #0A3A3C; }
          @media print { .print-btn { display: none; } body { padding: 0; background: #fff; } .doc { box-shadow: none; border-radius: 0; max-width: 100%; } }
        ` }} />
      </head>
      <body>
        <PrintButton />
        <div className="doc">
          <div className="header">
            <div>
              <div className="brand">{cfg.brand_name || "RK Residency"}</div>
              <div className="tagline">{cfg.brand_tagline || "Vrindavan · Braj"}</div>
            </div>
            <div>
              <div className="doc-type">{title}</div>
              <div className="doc-date">{fmt(new Date())}</div>
            </div>
          </div>
          <div className="gold-line" />

          <div className="body">
            <div className="ref-bar">
              <div>
                <div className="label">Booking Reference</div>
                <div className="value">{booking.referenceCode}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label">Status</div>
                <div className="value" style={{ color: booking.status === "CANCELLED" ? "#C2410C" : "#0E4C4F" }}>
                  {booking.status.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">GUEST DETAILS</div>
              <div className="detail-row"><div className="lbl">Name</div><div className="val">{booking.guestName}</div></div>
              <div className="detail-row"><div className="lbl">Email</div><div className="val">{booking.guestEmail}</div></div>
              <div className="detail-row"><div className="lbl">Phone</div><div className="val">{booking.guestPhone}</div></div>
              {booking.specialRequests && <div className="detail-row"><div className="lbl">Special Requests</div><div className="val">{booking.specialRequests}</div></div>}
            </div>

            <div className="section">
              <div className="section-title">STAY DETAILS</div>
              <div className="detail-row"><div className="lbl">Room</div><div className="val">{booking.room.name}</div></div>
              <div className="detail-row"><div className="lbl">Check-in</div><div className="val">{fmt(booking.checkIn)} · After 12:00 PM</div></div>
              <div className="detail-row"><div className="lbl">Check-out</div><div className="val">{fmt(booking.checkOut)} · Before 11:00 AM</div></div>
              <div className="detail-row"><div className="lbl">Nights</div><div className="val">{booking.nights}</div></div>
              <div className="detail-row"><div className="lbl">Guests</div><div className="val">{booking.adults} Adults{booking.children > 0 ? `, ${booking.children} Children` : ""}</div></div>
            </div>

            <div className="section">
              <div className="section-title">PAYMENT SUMMARY</div>
              <table className="payment-table">
                <thead>
                  <tr><th>Description</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  <tr><td>Room ({booking.nights} nights × ₹{booking.pricePerNight.toLocaleString("en-IN")})</td><td>₹{booking.subtotal.toLocaleString("en-IN")}</td></tr>
                  <tr><td>GST (12%)</td><td>₹{booking.taxesGst.toLocaleString("en-IN")}</td></tr>
                  <tr><td>Service Fee</td><td>₹{booking.serviceFee.toLocaleString("en-IN")}</td></tr>
                  <tr className="total-row"><td>TOTAL AMOUNT</td><td>₹{booking.totalAmount.toLocaleString("en-IN")}</td></tr>
                </tbody>
              </table>
              <div className="pay-status">
                Payment Status:
                <span className={`badge ${booking.paymentStatus === "PAID" ? "paid" : "pending"}`}>{booking.paymentStatus}</span>
                <span style={{ marginLeft: 12 }}>Method: {booking.paymentMethod || "N/A"}</span>
              </div>
            </div>

            {isInvoice ? (
              <div className="gst-info">
                GSTIN: {cfg.gstin || "09AAACK1234R1Z5"}<br />
                This is a computer-generated invoice and does not require a physical signature.
              </div>
            ) : (
              <div className="info-box">
                <ul>
                  <li>Please present this voucher at check-in along with a valid photo ID.</li>
                  <li>Check-in time is 12:00 PM. Early check-in subject to availability.</li>
                  <li>Free cancellation up to 72 hours before check-in.</li>
                  <li>Daily satvik breakfast is included for all guests.</li>
                  <li>Contact us at {cfg.phone_primary || "+91 9760814931"} for any assistance.</li>
                </ul>
              </div>
            )}
          </div>

          <div className="footer">
            <div className="name">{cfg.brand_name || "RK Residency"}</div>
            <div className="addr">{cfg.address_full || "RK Residency, Parikrama Marg, Vrindavan, UP 281121"}</div>
            <div className="contact">{cfg.phone_primary || "+91 9760814931"}  ·  {cfg.email_primary || "stay@rkresidency.in"}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
