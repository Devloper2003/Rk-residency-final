import { db } from "@/lib/db";
import { PrintButton } from "../PrintButton";
import { modeLabel, paidAmountOf } from "@/lib/payment-modes";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

/**
 * /booking-doc/[bookingId]?type=voucher|invoice
 *
 * Printable HTML twin of the owner-approved PDF design (cream page, gold frame,
 * ॥ श्री राधे ॥ motif, deep-green + gold palette) — the same design the admin
 * panel downloads and guests receive by email, so every copy of the document
 * looks identical. Guests land here right after booking and can print or
 * save as PDF (Ctrl+P / Cmd+P).
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
    include: { room: { select: { name: true, bedType: true } } },
  });

  if (!booking) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Booking not found</div>;
  }

  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["brand_name", "phone_primary", "email_primary", "address_full", "gstin", "bank_upi_id", "logo_image_url"] } },
    select: { key: true, value: true },
  });
  const cfg: Record<string, string> = {};
  settings.forEach((s) => { cfg[s.key] = s.value; });
  cfg.brand_name = cfg.brand_name || "RK Residency";
  cfg.phone_primary = cfg.phone_primary || "+91 9760814931";
  cfg.email_primary = cfg.email_primary || "rkresiddency121@gmail.com";
  cfg.address_full = cfg.address_full || "Near Shani Dev Mandir, Kailash Nagar, Vrindavan, Uttar Pradesh 281121";
  cfg.gstin = cfg.gstin || "09GUJPS8343M1ZK";

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const m0 = (n: number) => "\u20B9" + Math.round(n).toLocaleString("en-IN");
  const m2 = (n: number) =>
    "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const isInvoice = type === "invoice";
  const paid = paidAmountOf(booking);
  const balance = Math.max(booking.totalAmount - paid, 0);
  const subtotal = booking.subtotal || booking.totalAmount;
  const gross = Math.round((booking.pricePerNight || 0) * (booking.nights || 1));
  const discount = Math.max(gross - subtotal, 0);
  const gst = booking.taxesGst || Math.round(subtotal * 0.05);
  const cgst = Math.floor(gst / 2);
  const sgst = gst - cgst;
  const contactLine = `${cfg.address_full} \u00B7 Ph: ${cfg.phone_primary} \u00B7 ${cfg.email_primary} \u00B7 GSTIN: ${cfg.gstin}`;

  const statusText =
    booking.status === "CONFIRMED" ? "CONFIRMED"
    : booking.status === "PENDING" ? "PENDING"
    : booking.status.replace(/_/g, " ").toUpperCase();

  const amountInWords = (num: number): string => {
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
  };

  const Label = ({ children }: { children: ReactNode }) => (
    <div style={{ color: "#B9974C", fontSize: 8, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>
  );

  const Header = ({ title, right }: { title: string; right: ReactNode }) => (
    <>
      {/* Motif */}
      <div style={{ textAlign: "center", paddingTop: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/motif-radhe.png" alt="॥ श्री राधे ॥" style={{ height: 22, opacity: 0.95 }} />
      </div>
      {/* Brand + title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 34px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {cfg.logo_image_url ? (
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "#FFFFFF",
              border: "1px solid #B9974C", display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cfg.logo_image_url} alt={cfg.brand_name} style={{ width: 40, height: 40, objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "#1D5B45",
              border: "1px solid #B9974C", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#B9974C", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>RK</span>
            </div>
          )}
          <div>
            <div style={{ color: "#1D5B45", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{cfg.brand_name}</div>
            <div style={{ color: "#B9974C", fontSize: 7.5, letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>Boutique Hotel &nbsp;&middot;&nbsp; Vrindavan</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#22332B", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: title.length > 10 ? 21 : 27, letterSpacing: 2, lineHeight: 1 }}>{title}</div>
          {right}
        </div>
      </div>
      {/* Contact */}
      <div style={{ padding: "10px 34px 12px", color: "#78756B", fontSize: 9.5, textAlign: "center", lineHeight: 1.5 }}>{contactLine}</div>
      <div style={{ margin: "0 34px", borderTop: "1px solid #B9974C" }} />
    </>
  );

  const Footer = ({ line, note }: { line: string; note: string }) => (
    <div style={{ textAlign: "center", padding: "18px 34px 22px" }}>
      <div style={{ color: "#16493A", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14 }}>{line}</div>
      <div style={{ color: "#98948A", fontSize: 8.5, marginTop: 6 }}>{note}</div>
    </div>
  );

  const SignRow = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 34px", marginTop: 26 }}>
      <div style={{ color: "#78756B", fontSize: 9.5 }}>Guest signature</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 150, borderTop: "1px solid #9C988B", marginBottom: 6 }} />
        <div style={{ color: "#78756B", fontSize: 9.5 }}>Authorised signatory</div>
        <div style={{ color: "#78756B", fontSize: 9.5 }}>{cfg.brand_name}</div>
      </div>
    </div>
  );

  /* ── VOUCHER ── */
  const plan = (booking.planName || "").toUpperCase();
  const inclusions: string[] = [];
  if (plan.includes("CP") || plan.includes("BREAKFAST")) inclusions.push("Complimentary breakfast");
  inclusions.push("Free Wi-Fi and parking");
  inclusions.push("Housekeeping and 24\u00D77 reception");

  const VoucherLayout = () => (
    <>
      <Header
        title="BOOKING VOUCHER"
        right={
          <>
            <div style={{ color: "#78756B", fontSize: 10, marginTop: 6 }}>Voucher No. {booking.referenceCode} &nbsp;&middot;&nbsp; Date {fmt(new Date())}</div>
            <div style={{ display: "inline-block", border: "1.2px solid #1D5B45", color: "#1D5B45", fontWeight: 700, fontSize: 9.5, letterSpacing: 1.6, padding: "4px 14px", borderRadius: 3, marginTop: 8 }}>{statusText}</div>
          </>
        }
      />
      <div style={{ padding: "16px 34px 0" }}>
        {/* Guest band */}
        <div style={{ display: "flex", background: "#EFF3E2" }}>
          <div style={{ flex: 2, padding: "10px 14px" }}>
            <Label>Guest name</Label>
            <div style={{ color: "#16493A", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 19 }}>{booking.guestName}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 14px", borderLeft: "1px solid #D9E0C5" }}>
            <Label>Contact</Label>
            <div style={{ color: "#2A352E", fontSize: 12, marginTop: 3 }}>{booking.guestPhone}</div>
          </div>
          <div style={{ flex: 1.2, padding: "10px 14px", borderLeft: "1px solid #D9E0C5" }}>
            <Label>Booking ID</Label>
            <div style={{ color: "#2A352E", fontSize: 12, fontWeight: 700, marginTop: 3 }}>{booking.referenceCode}</div>
          </div>
        </div>

        {/* Check-in / nights / check-out */}
        <div style={{ display: "flex", alignItems: "stretch", border: "1px solid #D9D3BF", marginTop: 14 }}>
          <div style={{ flex: 1, padding: "12px 16px" }}>
            <Label>Check-in</Label>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 20, color: "#2A352E" }}>{fmt(new Date(booking.checkIn))}</div>
            <div style={{ color: "#78756B", fontSize: 9.5, marginTop: 2 }}>From 12:00 PM</div>
          </div>
          <div style={{ width: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #D9D3BF", borderRight: "1px solid #D9D3BF", padding: "10px 0" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1D5B45", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>{booking.nights || 1}</div>
            <div style={{ color: "#78756B", fontSize: 8.5, marginTop: 4 }}>Night(s)</div>
          </div>
          <div style={{ flex: 1, padding: "12px 16px", textAlign: "right" }}>
            <Label>Check-out</Label>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 20, color: "#2A352E" }}>{fmt(new Date(booking.checkOut))}</div>
            <div style={{ color: "#78756B", fontSize: 9.5, marginTop: 2 }}>Till 11:00 AM</div>
          </div>
        </div>

        {/* 4×2 grid */}
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 14, border: "1px solid #D9D3BF" }}>
          {([
            ["ROOM TYPE", booking.room?.name || "Room"],
            ["NO. OF ROOMS", "1"],
            ["GUESTS", `${booking.adults} Adults, ${booking.children} Child`],
            ["MEAL PLAN", booking.planName || "Room Only"],
            ["BOOKED VIA", "Direct \u2014 Website"],
            ["ARRIVAL TIME", "Approx. 2:00 PM"],
            ["BED PREFERENCE", booking.room?.bedType || "Double"],
            ["ID REQUIRED", "Aadhaar / Passport"],
          ] as [string, string][]).map(([k, v], i) => (
            <div key={k} style={{
              width: "25%", boxSizing: "border-box", padding: "8px 10px",
              borderLeft: i % 4 !== 0 ? "1px solid #D9D3BF" : "none",
              borderTop: i >= 4 ? "1px solid #D9D3BF" : "none",
              minHeight: 52,
            }}>
              <Label>{k}</Label>
              <div style={{ color: "#2A352E", fontSize: 11, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Money band */}
        <div style={{ display: "flex", background: "#1D5B45", marginTop: 14 }}>
          {([
            ["TOTAL TARIFF (INCL. GST)", m0(booking.totalAmount)],
            ["ADVANCE RECEIVED", m0(paid)],
            ["BALANCE AT HOTEL", m0(balance)],
          ] as [string, string][]).map(([k, v], i) => (
            <div key={k} style={{ flex: 1, padding: "12px 16px", borderLeft: i > 0 ? "1px solid #3A6E58" : "none" }}>
              <div style={{ color: "#CFE0D3", fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2 }}>{k}</div>
              <div style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 19, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Inclusions + special requests */}
        <div style={{ display: "flex", marginTop: 16, gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Label>Inclusions</Label>
            {inclusions.map((inc) => (
              <div key={inc} style={{ color: "#4A473E", fontSize: 11, marginTop: 4 }}>
                <span style={{ color: "#B9974C", marginRight: 6 }}>&bull;</span>{inc}
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <Label>Special requests</Label>
            <div style={{ color: "#4A473E", fontSize: 11, marginTop: 4 }}>{booking.specialRequests?.trim() || "None noted"}</div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ marginTop: 18 }}>
          <Label>Important terms</Label>
          {[
            "Please carry a valid photo ID for every guest; it is mandatory at check-in.",
            "Check-in 12:00 PM and check-out 11:00 AM; early or late subject to availability.",
            "Advance is non-refundable if cancelled within 48 hours of arrival.",
            "Please present this voucher (printed or on phone) at reception.",
          ].map((t, i) => (
            <div key={i} style={{ color: "#57544B", fontSize: 10, marginTop: 3 }}>{i + 1}. &nbsp;{t}</div>
          ))}
        </div>
      </div>

      <SignRow />

      {/* Cut line + reception copy */}
      <div style={{ margin: "20px 0 0", borderTop: "1.5px dashed #B9974C", position: "relative" }}>
        <span style={{ position: "absolute", left: 30, top: -9, color: "#B9974C", fontSize: 11 }}>&#9986;</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 34px 0", color: "#78756B", fontSize: 9.5 }}>
        <div>Reception copy &nbsp;&middot;&nbsp; Voucher {booking.referenceCode} &nbsp;&middot;&nbsp; Guest {booking.guestName}</div>
        <div>Guest sign: ____________</div>
      </div>

      <Footer line={"Radhe Radhe \u2013 we look forward to welcoming you!"} note="This is a computer-generated voucher." />
    </>
  );

  /* ── INVOICE ── */
  const InvoiceLayout = () => (
    <>
      <Header
        title="INVOICE"
        right={
          <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.7 }}>
            {[["Invoice No.", booking.referenceCode], ["Date", fmt(new Date())], ["Payment", modeLabel(booking.paymentMethod)]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <span style={{ color: "#78756B" }}>{k}</span>
                <span style={{ color: "#2A352E", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        }
      />
      <div style={{ padding: "16px 34px 0" }}>
        {/* Billed to / booking details */}
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <Label>Billed to</Label>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 17, color: "#2A352E" }}>{booking.guestName}</div>
            <div style={{ color: "#57544B", fontSize: 11, marginTop: 4 }}>{booking.guestEmail}</div>
            <div style={{ color: "#57544B", fontSize: 11 }}>{booking.guestPhone}</div>
          </div>
          <div style={{ flex: 1, paddingLeft: 30 }}>
            <Label>Booking details</Label>
            <div style={{ color: "#2A352E", fontSize: 11, marginTop: 4 }}>Booking ID: &nbsp;{booking.referenceCode}</div>
            <div style={{ color: "#2A352E", fontSize: 11 }}>Guests: &nbsp;{booking.adults} Adults{booking.children > 0 ? `, ${booking.children} Child` : ""}</div>
            <div style={{ color: "#2A352E", fontSize: 11 }}>Source: &nbsp;Direct &mdash; Website</div>
          </div>
        </div>

        {/* Stay band */}
        <div style={{ display: "flex", background: "#EFF3E2", marginTop: 14 }}>
          {([
            ["CHECK-IN", `${fmt(new Date(booking.checkIn))}, 12:00 PM`, 2],
            ["CHECK-OUT", `${fmt(new Date(booking.checkOut))}, 11:00 AM`, 2],
            ["ROOM", booking.room?.name || "Room", 1.6],
            ["NIGHTS", String(booking.nights || 1), 0.8],
          ] as [string, string, number][]).map(([k, v, flex], i) => (
            <div key={k} style={{ flex, padding: "9px 12px", borderLeft: i > 0 ? "1px solid #D9E0C5" : "none" }}>
              <Label>{k}</Label>
              <div style={{ color: "#2A352E", fontSize: 11.5, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
          <thead>
            <tr style={{ background: "#1D5B45" }}>
              <th style={{ textAlign: "left", padding: "7px 12px", color: "#fff", fontSize: 8.5, letterSpacing: 1.4, fontWeight: 700 }}>DESCRIPTION</th>
              <th style={{ textAlign: "center", padding: "7px 12px", color: "#fff", fontSize: 8.5, letterSpacing: 1.4, fontWeight: 700, width: 60 }}>QTY</th>
              <th style={{ textAlign: "right", padding: "7px 12px", color: "#fff", fontSize: 8.5, letterSpacing: 1.4, fontWeight: 700, width: 100 }}>RATE (&#8377;)</th>
              <th style={{ textAlign: "right", padding: "7px 12px", color: "#fff", fontSize: 8.5, letterSpacing: 1.4, fontWeight: 700, width: 110 }}>AMOUNT (&#8377;)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #D9D3BF" }}>
              <td style={{ padding: "10px 12px", fontFamily: "Georgia, serif", fontSize: 12, color: "#2A352E" }}>Room tariff &ndash; {booking.room?.name || "Room"}</td>
              <td style={{ padding: "10px 12px", textAlign: "center", color: "#57544B", fontSize: 11 }}>{booking.nights || 1}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>{Math.round(booking.pricePerNight || 0).toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>{m2(gross)}</td>
            </tr>
            {booking.serviceFee > 0 && (
              <tr style={{ borderBottom: "1px solid #D9D3BF" }}>
                <td style={{ padding: "10px 12px", fontFamily: "Georgia, serif", fontSize: 12, color: "#2A352E" }}>Extra bed / breakfast &amp; services</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#57544B", fontSize: 11 }}>1</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>{m0(booking.serviceFee)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>{m2(booking.serviceFee)}</td>
              </tr>
            )}
            {discount > 0 && (
              <tr style={{ borderBottom: "1px solid #D9D3BF" }}>
                <td style={{ padding: "10px 12px", fontFamily: "Georgia, serif", fontSize: 12, color: "#2A352E" }}>Discount (coupon)</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#57544B", fontSize: 11 }}>&mdash;</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>&mdash;</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#57544B", fontSize: 11 }}>&minus;{m2(discount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Words + terms | totals */}
        <div style={{ display: "flex", marginTop: 16 }}>
          <div style={{ flex: 1.2, paddingRight: 24 }}>
            <Label>Amount in words</Label>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "#2A352E" }}>
              Rupees {amountInWords(booking.totalAmount)} Only
            </div>
            <div style={{ marginTop: 18 }}>
              <Label>Terms</Label>
              {[
                "Check-in 12:00 PM, check-out 11:00 AM.",
                "Valid photo ID is mandatory for all guests.",
                "Advance is non-refundable within 48 hours of arrival.",
                "Balance payable by UPI / Cash / Card at reception.",
              ].map((t, i) => (
                <div key={i} style={{ color: "#57544B", fontSize: 10, marginTop: 3 }}>{i + 1}. &nbsp;{t}</div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {([
              ["Subtotal", m2(gross)],
              ["Discount (\u20B9)", String(discount)],
              ["GST (5%)", m2(gst)],
              ["CGST + SGST (half each)", `${m2(cgst)} + ${m2(sgst)}`],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#57544B", marginTop: 4 }}>
                <span>{k}</span><span style={{ color: "#2A352E" }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: "1.5px solid #1D5B45", marginTop: 8, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 15, color: "#2A352E" }}>Total</span>
              <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 17, color: "#1D5B45" }}>{m2(booking.totalAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#57544B", marginTop: 7 }}>
              <span>Advance paid (&#8377;)</span><span style={{ color: "#2A352E" }}>{m0(paid)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#EFF3E2", padding: "7px 10px", marginTop: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2A352E" }}>Balance due</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2A352E" }}>{m2(balance)}</span>
            </div>
          </div>
        </div>
      </div>

      <SignRow />
      <Footer line={"Radhe Radhe \u2013 thank you for staying with us!"} note="This is a computer-generated invoice." />
    </>
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{isInvoice ? "Invoice" : "Booking Voucher"} &mdash; {booking.referenceCode} | {cfg.brand_name}</title>
        <style dangerouslySetInnerHTML={{ __html: SHARED_CSS }} />
      </head>
      <body>
        <PrintButton />
        <div className="sheet">
          {isInvoice ? <InvoiceLayout /> : <VoucherLayout />}
        </div>
      </body>
    </html>
  );
}

const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #EDE9DC;
    color: #2A352E;
    padding: 24px 12px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    max-width: 800px; margin: 0 auto; background: #FBF9F1;
    border: 1px solid #B9974C; border-top: 4px solid #B9974C;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding-bottom: 8px;
  }
  @media print {
    body { padding: 0; background: #FBF9F1; }
    .sheet { box-shadow: none; max-width: 100%; border: none; border-top: 3px solid #B9974C; }
    @page { size: A4; margin: 10mm; }
  }
`;
