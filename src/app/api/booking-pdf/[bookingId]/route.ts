import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/booking-pdf/[bookingId]?type=voucher|invoice
 *
 * Generates a real PDF (vector text, selectable, brand-styled) for the booking.
 * Requires admin auth — guests get their PDFs from the public /booking-doc
 * print-to-PDF route. This admin route is used by the BookingDetailModal
 * "Download Voucher" and "Download Invoice" buttons.
 *
 * Output: application/pdf binary stream (Content-Disposition: attachment)
 */

// ─── Brand palette ───────────────────────────────────────────────────
const TEAL = "#0E4C4F";
const TEAL_DEEP = "#0A3A3C";
const GOLD = "#C9A24A";
const GOLD_SOFT = "#D9B978";
const IVORY = "#F5F2ED";
const IVORY_DEEP = "#EAE3D6";
const CHARCOAL = "#231F1C";
const CHARCOAL_SOFT = "#5C534A";
const MARSALA = "#7A2E2E";

const MM = (mm: number) => mm * 2.83465; // mm → PDF points (1 pt = 1/72 inch, 1 mm = 2.83465 pt)
const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89; // A4 height in pt
const LEFT = MM(15);
const RIGHT = PAGE_W - MM(15);
const CONTENT_W = RIGHT - LEFT;

function formatINR(n: number): string {
  return "\u20B9 " + n.toLocaleString("en-IN");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Amount in words (simple Indian system)
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

type Cfg = Record<string, string>;

interface BookingRow {
  id: string;
  referenceCode: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string | null;
  pricePerNight: number;
  subtotal: number;
  taxesGst: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  createdAt: Date;
  room?: { name: string; slug: string; view?: string | null; bedType?: string | null; maxGuests?: number | null; sizeSqft?: number | null; basePrice?: number | null; imageUrls?: string | null } | null;
  guest?: { id: string; name: string; email: string; phone: string; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; country?: string | null } | null;
}

// ─── PDF drawing helpers ─────────────────────────────────────────────

function drawFooter(doc: PDFKit.PDFDocument, cfg: Cfg, pageNum: number) {
  const y = MM(18);
  doc.lineWidth(0.6).strokeColor(GOLD).moveTo(LEFT, y).lineTo(RIGHT, y).stroke();

  doc.fillColor(CHARCOAL_SOFT).fontSize(7.5).font("Helvetica");
  const addr = cfg.address_full || "Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121";
  doc.text(`${cfg.brand_name || "RK Residency"}  ·  ${addr}`, LEFT, y - 6, { width: CONTENT_W * 0.7 });
  doc.text(`Tel: ${cfg.phone_primary || ""}  ·  Email: ${cfg.email_primary || ""}  ·  Web: ${cfg.website_url || ""}`, LEFT, y - 14, { width: CONTENT_W * 0.7 });

  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(7.5);
  if (cfg.gstin) doc.text(`GSTIN: ${cfg.gstin}`, RIGHT - 100, y - 6, { width: 100, align: "right" });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").text(`Page ${pageNum}`, RIGHT - 100, y - 14, { width: 100, align: "right" });

  doc.fillColor("#A39A8C").font("Helvetica-Oblique").fontSize(6.5);
  doc.text("This is a computer-generated document — no signature required.", LEFT, y - 22, { width: CONTENT_W, align: "center" });
}

function drawHeader(doc: PDFKit.PDFDocument, cfg: Cfg, label: string, y: number): number {
  // Teal header band with gold underline
  doc.rect(LEFT, y, CONTENT_W, 50).fill(TEAL);
  doc.rect(LEFT, y + 50, CONTENT_W, 2).fill(GOLD);

  // Brand on left
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(20).text(cfg.brand_name || "RK Residency", LEFT + 14, y + 8);
  doc.fillColor(GOLD_SOFT).font("Helvetica-Oblique").fontSize(9).text(cfg.brand_tagline || "Heritage Luxury in Vrindavan", LEFT + 14, y + 33);

  // Doc label on right
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(9).text("DOCUMENT", RIGHT - 200, y + 6, { width: 186, align: "right" });
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(18).text(label, RIGHT - 200, y + 20, { width: 186, align: "right" });

  return y + 50 + 8; // bottom of header + small gap
}

function drawInfoRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, w: number, valueFont = "Helvetica-Bold") {
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x, y, { width: w });
  doc.fillColor(CHARCOAL).font(valueFont).fontSize(10).text(value, x, y + 12, { width: w });
  return y + 28;
}

function drawSectionHeader(doc: PDFKit.PDFDocument, text: string, color: string, x: number, y: number, w: number): number {
  doc.rect(x, y, w, 16).fill(color);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(10).text(text, x + 8, y + 4, { width: w - 16 });
  return y + 16;
}

// ─── Build Voucher PDF ───────────────────────────────────────────────

function buildVoucher(doc: PDFKit.PDFDocument, b: BookingRow, cfg: Cfg) {
  let y = MM(12);
  y = drawHeader(doc, cfg, "BOOKING VOUCHER", y);

  // 1. Reference + dates strip (ivory box)
  doc.rect(LEFT, y, CONTENT_W, 36).fill(IVORY).strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, 36).stroke();
  const colW = CONTENT_W / 3;
  const col1 = LEFT + 10, col2 = LEFT + colW + 10, col3 = LEFT + 2 * colW + 10;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("BOOKING REFERENCE", col1, y + 6, { width: colW - 10 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(13).text(b.referenceCode, col1, y + 18, { width: colW - 10 });

  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("VOUCHER DATE", col2, y + 6, { width: colW - 10 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(10).text(fmtDate(new Date()), col2, y + 20, { width: colW - 10 });

  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("BOOKING DATE", col3, y + 6, { width: colW - 10 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(10).text(fmtDate(b.createdAt), col3, y + 20, { width: colW - 10 });

  y += 36 + 6;

  // 2. Status banner
  doc.rect(LEFT, y, CONTENT_W, 24).fill(TEAL_DEEP);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(11).text(
    `STATUS:  ${b.status.replace(/_/g, " ")}  ·  PAYMENT:  ${b.paymentStatus}`,
    LEFT, y + 7, { width: CONTENT_W, align: "center" }
  );
  y += 24 + 8;

  // 3. Guest + Stay details side by side
  const blockW = (CONTENT_W - 6) / 2;
  const guestX = LEFT, stayX = LEFT + blockW + 6;

  // Guest block
  y = drawSectionHeader(doc, "GUEST DETAILS", TEAL, guestX, y, blockW);
  let guestY = y + 6;
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9).text(b.guestName, guestX + 8, guestY, { width: blockW - 16 });
  guestY += 14;
  doc.font("Helvetica").fontSize(9).fillColor(CHARCOAL).text(b.guestEmail, guestX + 8, guestY, { width: blockW - 16 });
  guestY += 12;
  doc.text(b.guestPhone, guestX + 8, guestY, { width: blockW - 16 });
  guestY += 12;
  const g = b.guest;
  if (g && (g.address || g.city)) {
    const addr = [g.address, g.city, g.state, g.pincode].filter(Boolean).join(", ");
    doc.fillColor(CHARCOAL_SOFT).fontSize(8.5).text(addr, guestX + 8, guestY, { width: blockW - 16 });
  }
  // Outline guest block
  doc.strokeColor(GOLD).lineWidth(0.5).rect(guestX, y - 16, blockW, Math.max(60, guestY - y + 14)).stroke();
  const guestBlockH = Math.max(60, guestY - y + 14) + 16;

  // Stay block (same row)
  let stayY = y + 6;
  const roomName = b.room?.name || "—";
  const roomView = b.room?.view || "—";
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9).text(`${roomName}  (${roomView})`, stayX + 8, stayY, { width: blockW - 16 });
  stayY += 14;
  doc.font("Helvetica").fontSize(9).fillColor(CHARCOAL).text(`Check-In: ${fmtDate(b.checkIn)} (after 2:00 PM)`, stayX + 8, stayY, { width: blockW - 16 });
  stayY += 12;
  doc.text(`Check-Out: ${fmtDate(b.checkOut)} (before 11:00 AM)`, stayX + 8, stayY, { width: blockW - 16 });
  stayY += 12;
  doc.text(`${b.nights} night(s)  ·  ${b.adults} Adult(s)${b.children > 0 ? `, ${b.children} Child(ren)` : ""}`, stayX + 8, stayY, { width: blockW - 16 });
  doc.strokeColor(GOLD).lineWidth(0.5).rect(stayX, y - 16, blockW, Math.max(60, stayY - y + 14)).stroke();

  y += Math.max(guestBlockH, Math.max(60, stayY - y + 14) + 16) + 6;

  // 4. Room specifications
  const specCols = [CONTENT_W * 0.40, CONTENT_W * 0.25, CONTENT_W * 0.15, CONTENT_W * 0.20];
  const specY = y;
  doc.rect(LEFT, specY, CONTENT_W, 16).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  doc.text("ROOM SPECIFICATIONS", LEFT + 8, specY + 5, { width: specCols[0] - 8 });
  doc.text("BED", LEFT + specCols[0] + 8, specY + 5, { width: specCols[1] - 8 });
  doc.text("MAX GUESTS", LEFT + specCols[0] + specCols[1] + 8, specY + 5, { width: specCols[2] - 8 });
  doc.text("ROOM SIZE", LEFT + specCols[0] + specCols[1] + specCols[2] + 8, specY + 5, { width: specCols[3] - 8 });
  // Body row
  doc.fillColor(IVORY).rect(LEFT, specY + 16, CONTENT_W, 22).fill();
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9);
  doc.text(roomName, LEFT + 8, specY + 22, { width: specCols[0] - 8 });
  doc.font("Helvetica").text(b.room?.bedType || "—", LEFT + specCols[0] + 8, specY + 22, { width: specCols[1] - 8 });
  doc.text(`${b.room?.maxGuests ?? b.adults} Guests`, LEFT + specCols[0] + specCols[1] + 8, specY + 22, { width: specCols[2] - 8 });
  doc.text(b.room?.sizeSqft ? `${b.room.sizeSqft} sq.ft` : "—", LEFT + specCols[0] + specCols[1] + specCols[2] + 8, specY + 22, { width: specCols[3] - 8 });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, specY, CONTENT_W, 38).stroke();
  y = specY + 38 + 8;

  // 5. Charges summary
  const chCols = [CONTENT_W * 0.50, CONTENT_W * 0.18, CONTENT_W * 0.12, CONTENT_W * 0.20];
  const chY = y;
  doc.rect(LEFT, chY, CONTENT_W, 16).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  doc.text("CHARGE DESCRIPTION", LEFT + 8, chY + 5, { width: chCols[0] - 8 });
  doc.text("PER NIGHT", LEFT + chCols[0] + 8, chY + 5, { width: chCols[1] - 8, align: "right" });
  doc.text("NIGHTS", LEFT + chCols[0] + chCols[1] + 8, chY + 5, { width: chCols[2] - 8, align: "right" });
  doc.text("AMOUNT", LEFT + chCols[0] + chCols[1] + chCols[2] + 8, chY + 5, { width: chCols[3] - 8, align: "right" });

  let rowY = chY + 16;
  // Room tariff row
  doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 20).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(`Room Tariff — ${roomName}`, LEFT + 8, rowY + 6, { width: chCols[0] - 8 });
  doc.text(formatINR(b.pricePerNight), LEFT + chCols[0] + 8, rowY + 6, { width: chCols[1] - 8, align: "right" });
  doc.text(String(b.nights), LEFT + chCols[0] + chCols[1] + 8, rowY + 6, { width: chCols[2] - 8, align: "right" });
  doc.text(formatINR(b.subtotal), LEFT + chCols[0] + chCols[1] + chCols[2] + 8, rowY + 6, { width: chCols[3] - 8, align: "right" });
  rowY += 20;

  // GST row
  doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 20).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text("GST (12% on room tariff)", LEFT + 8, rowY + 6, { width: chCols[0] - 8 });
  doc.text("—", LEFT + chCols[0] + 8, rowY + 6, { width: chCols[1] - 8, align: "right" });
  doc.text("—", LEFT + chCols[0] + chCols[1] + 8, rowY + 6, { width: chCols[2] - 8, align: "right" });
  doc.text(formatINR(b.taxesGst), LEFT + chCols[0] + chCols[1] + chCols[2] + 8, rowY + 6, { width: chCols[3] - 8, align: "right" });
  rowY += 20;

  // Service fee row (if any)
  if (b.serviceFee > 0) {
    doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 20).fill();
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
    doc.text("Service Fee", LEFT + 8, rowY + 6, { width: chCols[0] - 8 });
    doc.text("—", LEFT + chCols[0] + 8, rowY + 6, { width: chCols[1] - 8, align: "right" });
    doc.text("—", LEFT + chCols[0] + chCols[1] + 8, rowY + 6, { width: chCols[2] - 8, align: "right" });
    doc.text(formatINR(b.serviceFee), LEFT + chCols[0] + chCols[1] + chCols[2] + 8, rowY + 6, { width: chCols[3] - 8, align: "right" });
    rowY += 20;
  }

  // Grand total row (teal-deep band)
  doc.fillColor(TEAL_DEEP).rect(LEFT, rowY, CONTENT_W, 22).fill();
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(9);
  doc.text("GRAND TOTAL", LEFT + 8, rowY + 7, { width: chCols[0] - 8 });
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(10);
  doc.text(formatINR(b.totalAmount), LEFT + chCols[0] + chCols[1] + chCols[2] + 8, rowY + 7, { width: chCols[3] - 8, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, chY, CONTENT_W, rowY + 22 - chY).stroke();
  y = rowY + 22 + 8;

  // 6. Inclusions
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9.5);
  doc.text(
    `Inclusions: Complimentary Satvik Breakfast included. Complimentary Wi-Fi, daily housekeeping, assistance with temple visits, and all applicable taxes.`,
    LEFT, y, { width: CONTENT_W }
  );
  y += 24;

  // 7. Special requests
  if (b.specialRequests) {
    y = drawSectionHeader(doc, "SPECIAL REQUESTS", GOLD, LEFT, y, CONTENT_W);
    doc.fillColor(IVORY).rect(LEFT, y, CONTENT_W, 30).fill();
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(b.specialRequests, LEFT + 8, y + 6, { width: CONTENT_W - 16 });
    doc.strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y - 16, CONTENT_W, 46).stroke();
    y += 30 + 8;
  }

  // 8. Cancellation policy
  y = drawSectionHeader(doc, "CANCELLATION POLICY", MARSALA, LEFT, y, CONTENT_W);
  doc.fillColor("#FBF1F1").rect(LEFT, y, CONTENT_W, 44).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(
    "Free cancellation until 7 days before check-in. 50% refund for cancellations 3-6 days before. No refund for cancellations within 48 hours of check-in.",
    LEFT + 8, y + 6, { width: CONTENT_W - 16 }
  );
  doc.strokeColor(MARSALA).lineWidth(0.5).rect(LEFT, y - 16, CONTENT_W, 60).stroke();
  y += 44 + 10;

  // 9. Thank-you note
  const firstName = b.guestName.split(/\s+/)[0] || "Guest";
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11);
  doc.text(`Dear ${firstName}, thank you for choosing ${cfg.brand_name || "RK Residency"}.`, LEFT, y, { width: CONTENT_W });
  y += 18;
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9.5);
  doc.text(
    "Please present this voucher (printed or on your mobile) at the front desk upon arrival, along with a government-issued photo ID for each guest. Our concierge will assist with your luggage, temple tour bookings, and any special arrangements you may need during your stay in the holy land of Vrindavan.",
    LEFT, y, { width: CONTENT_W }
  );

  drawFooter(doc, cfg, 1);
}

// ─── Build Invoice PDF ───────────────────────────────────────────────

function buildInvoice(doc: PDFKit.PDFDocument, b: BookingRow, cfg: Cfg) {
  let y = MM(12);
  y = drawHeader(doc, cfg, "TAX INVOICE", y);

  // 1. Invoice meta strip (4 cols)
  const invNo = `INV-${b.referenceCode.split("-").slice(-2).join("-")}`;
  const metaCols = [CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25];
  doc.rect(LEFT, y, CONTENT_W, 32).fill(IVORY).strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, 32).stroke();
  const metaLabels = ["INVOICE NO.", "INVOICE DATE", "BOOKING REF.", "GSTIN"];
  const metaValues = [invNo, fmtDate(b.createdAt), b.referenceCode, cfg.gstin || "—"];
  for (let i = 0; i < 4; i++) {
    const cx = LEFT + metaCols.slice(0, i).reduce((a, b) => a + b, 0) + 8;
    doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7.5).text(metaLabels[i], cx, y + 5, { width: metaCols[i] - 10 });
    doc.fillColor(i === 0 ? TEAL : CHARCOAL).font(i === 0 ? "Helvetica-Bold" : "Helvetica-Bold").fontSize(i === 0 ? 12 : 10).text(metaValues[i], cx, y + 16, { width: metaCols[i] - 10 });
  }
  y += 32 + 6;

  // 2. Billed From / Billed To
  const billW = (CONTENT_W - 6) / 2;
  doc.rect(LEFT, y, CONTENT_W, 78).fill("#FFFFFF").strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, 78).stroke();
  doc.moveTo(LEFT + billW, y).lineTo(LEFT + billW, y + 78).strokeColor("#D9C8A0").lineWidth(0.3).stroke();

  // Billed From (left)
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("BILLED FROM", LEFT + 10, y + 6, { width: billW - 20 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11).text(cfg.brand_name || "RK Residency", LEFT + 10, y + 18, { width: billW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(cfg.address_full || "", LEFT + 10, y + 32, { width: billW - 20 });
  doc.text(`Tel: ${cfg.phone_primary || ""}`, LEFT + 10, y + 44, { width: billW - 20 });
  doc.text(`Email: ${cfg.email_primary || ""}`, LEFT + 10, y + 56, { width: billW - 20 });
  doc.text(`GSTIN: ${cfg.gstin || "—"}`, LEFT + 10, y + 68, { width: billW - 20 });

  // Billed To (right)
  const rightX = LEFT + billW + 10;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("BILLED TO", rightX, y + 6, { width: billW - 20 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11).text(b.guestName, rightX, y + 18, { width: billW - 20 });
  const g = b.guest;
  const gAddr = g && (g.address || g.city) ? [g.address, g.city, g.state, g.pincode].filter(Boolean).join(", ") : "";
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  if (gAddr) doc.text(gAddr, rightX, y + 32, { width: billW - 20 });
  doc.text(`Tel: ${b.guestPhone}`, rightX, y + 44, { width: billW - 20 });
  doc.text(`Email: ${b.guestEmail}`, rightX, y + 56, { width: billW - 20 });
  y += 78 + 6;

  // 3. Stay summary line
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(
    `Stay: ${b.room?.name || "—"} (${b.room?.view || "—"})  ·  Check-in: ${fmtDate(b.checkIn)}  ·  Check-out: ${fmtDate(b.checkOut)}  ·  ${b.nights} night(s)  ·  ${b.adults} Adult(s)`,
    LEFT, y, { width: CONTENT_W }
  );
  y += 16;

  // 4. Line items table — proper GST invoice format
  const itCols = [CONTENT_W * 0.05, CONTENT_W * 0.42, CONTENT_W * 0.13, CONTENT_W * 0.10, CONTENT_W * 0.13, CONTENT_W * 0.17];
  const itY = y;
  doc.rect(LEFT, itY, CONTENT_W, 16).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  const itHeads = ["#", "DESCRIPTION", "HSN/SAC", "QTY", "RATE", "AMOUNT"];
  let cx = LEFT;
  for (let i = 0; i < 6; i++) {
    doc.text(itHeads[i], cx + 6, itY + 5, { width: itCols[i] - 8, align: i >= 3 ? "right" : "left" });
    cx += itCols[i];
  }

  let rowY = itY + 16;
  // Item row
  doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 24).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  cx = LEFT;
  doc.text("1", cx + 6, rowY + 4, { width: itCols[0] - 8, align: "right" }); cx += itCols[0];
  doc.text(`${b.room?.name || "Room"} — ${b.room?.view || "—"}`, cx + 6, rowY + 4, { width: itCols[1] - 8 });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").fontSize(7.5).text(`Room tariff @ ${formatINR(b.pricePerNight)}/night, ${b.nights} night(s)`, cx + 6, rowY + 14, { width: itCols[1] - 8 });
  cx += itCols[1];
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text("996331", cx + 6, rowY + 4, { width: itCols[2] - 8, align: "right" }); cx += itCols[2];
  doc.text(`${b.nights} N`, cx + 6, rowY + 4, { width: itCols[3] - 8, align: "right" }); cx += itCols[3];
  doc.text(formatINR(b.pricePerNight), cx + 6, rowY + 4, { width: itCols[4] - 8, align: "right" }); cx += itCols[4];
  doc.text(formatINR(b.subtotal), cx + 6, rowY + 4, { width: itCols[5] - 8, align: "right" });
  rowY += 24;

  // Subtotal row
  doc.fillColor(IVORY).rect(LEFT, rowY, CONTENT_W, 18).fill();
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9);
  cx = LEFT;
  doc.text("", cx, rowY + 5, { width: itCols[0] }); cx += itCols[0];
  doc.text("Subtotal (Taxable Value)", cx + 6, rowY + 5, { width: itCols[1] + itCols[2] + itCols[3] + itCols[4] - 8 });
  cx += itCols[1] + itCols[2] + itCols[3] + itCols[4];
  doc.text(formatINR(b.subtotal), cx + 6, rowY + 5, { width: itCols[5] - 8, align: "right" });
  rowY += 18;

  // CGST row (half of GST)
  const cgst = Math.floor(b.taxesGst / 2);
  const sgst = b.taxesGst - cgst;
  doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 16).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  cx = LEFT;
  doc.text("", cx, rowY + 4, { width: itCols[0] }); cx += itCols[0];
  doc.text("CGST @ 6%", cx + 6, rowY + 4, { width: itCols[1] + itCols[2] + itCols[3] + itCols[4] - 8 });
  cx += itCols[1] + itCols[2] + itCols[3] + itCols[4];
  doc.text(formatINR(cgst), cx + 6, rowY + 4, { width: itCols[5] - 8, align: "right" });
  rowY += 16;

  // SGST row
  doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 16).fill();
  cx = LEFT;
  doc.text("", cx, rowY + 4, { width: itCols[0] }); cx += itCols[0];
  doc.text("SGST @ 6%", cx + 6, rowY + 4, { width: itCols[1] + itCols[2] + itCols[3] + itCols[4] - 8 });
  cx += itCols[1] + itCols[2] + itCols[3] + itCols[4];
  doc.text(formatINR(sgst), cx + 6, rowY + 4, { width: itCols[5] - 8, align: "right" });
  rowY += 16;

  // Service fee row (if any)
  if (b.serviceFee > 0) {
    doc.fillColor("#FFFFFF").rect(LEFT, rowY, CONTENT_W, 16).fill();
    cx = LEFT;
    doc.text("", cx, rowY + 4, { width: itCols[0] }); cx += itCols[0];
    doc.text("Service Fee", cx + 6, rowY + 4, { width: itCols[1] + itCols[2] + itCols[3] + itCols[4] - 8 });
    cx += itCols[1] + itCols[2] + itCols[3] + itCols[4];
    doc.text(formatINR(b.serviceFee), cx + 6, rowY + 4, { width: itCols[5] - 8, align: "right" });
    rowY += 16;
  }

  // Grand total row
  doc.fillColor(TEAL_DEEP).rect(LEFT, rowY, CONTENT_W, 20).fill();
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(9.5);
  cx = LEFT;
  doc.text("", cx, rowY + 6, { width: itCols[0] }); cx += itCols[0];
  doc.text("GRAND TOTAL", cx + 6, rowY + 6, { width: itCols[1] + itCols[2] - 8 });
  cx += itCols[1] + itCols[2];
  doc.text(`${b.nights} N`, cx + 6, rowY + 6, { width: itCols[3] - 8, align: "right" }); cx += itCols[3];
  doc.text("", cx, rowY + 6, { width: itCols[4] }); cx += itCols[4];
  doc.text(formatINR(b.totalAmount), cx + 6, rowY + 6, { width: itCols[5] - 8, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, itY, CONTENT_W, rowY + 20 - itY).stroke();
  y = rowY + 20 + 6;

  // 5. Amount in words
  const words = amountInWords(b.totalAmount);
  doc.fillColor(IVORY).rect(LEFT, y, CONTENT_W, 22).fill().strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, 22).stroke();
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text("GRAND TOTAL (IN WORDS):", LEFT + 10, y + 4, { width: 100 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11).text(`Rupees ${words} Only`, LEFT + 120, y + 5, { width: CONTENT_W - 130 });
  y += 22 + 6;

  // 6. Payment status
  const payCols = [CONTENT_W * 0.30, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.26];
  const payY = y;
  doc.rect(LEFT, payY, CONTENT_W, 16).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  doc.text("PAYMENT STATUS", LEFT + 8, payY + 5, { width: payCols[0] - 8 });
  doc.text("AMOUNT PAID", LEFT + payCols[0] + 8, payY + 5, { width: payCols[1] - 8, align: "right" });
  doc.text("BALANCE DUE", LEFT + payCols[0] + payCols[1] + 8, payY + 5, { width: payCols[2] - 8, align: "right" });
  doc.text("TOTAL", LEFT + payCols[0] + payCols[1] + payCols[2] + 8, payY + 5, { width: payCols[3] - 8, align: "right" });
  // body row
  const amountPaid = b.paymentStatus === "PAID" ? b.totalAmount : 0;
  const balance = b.totalAmount - amountPaid;
  doc.fillColor("#FFFFFF").rect(LEFT, payY + 16, CONTENT_W, 22).fill();
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9).text(b.paymentStatus, LEFT + 8, payY + 22, { width: payCols[0] - 8 });
  doc.font("Helvetica").text(formatINR(amountPaid), LEFT + payCols[0] + 8, payY + 22, { width: payCols[1] - 8, align: "right" });
  doc.fillColor(MARSALA).font("Helvetica-Bold").text(formatINR(balance), LEFT + payCols[0] + payCols[1] + 8, payY + 22, { width: payCols[2] - 8, align: "right" });
  doc.fillColor(TEAL).font("Helvetica-Bold").text(formatINR(b.totalAmount), LEFT + payCols[0] + payCols[1] + payCols[2] + 8, payY + 22, { width: payCols[3] - 8, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, payY, CONTENT_W, 38).stroke();
  y = payY + 38 + 6;

  // 7. Bank details + signature
  const halfW = (CONTENT_W - 6) / 2;
  doc.rect(LEFT, y, CONTENT_W, 70).fill("#FFFFFF").strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, 70).stroke();
  doc.moveTo(LEFT + halfW, y).lineTo(LEFT + halfW, y + 70).strokeColor("#D9C8A0").lineWidth(0.3).stroke();

  // Bank details (left)
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9).text("BANK DETAILS (for balance payment)", LEFT + 10, y + 6, { width: halfW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(`Beneficiary: ${cfg.brand_name || "RK Residency"} Pvt. Ltd.`, LEFT + 10, y + 20, { width: halfW - 20 });
  doc.text("Bank: HDFC Bank, Vrindavan Branch", LEFT + 10, y + 32, { width: halfW - 20 });
  doc.text("A/C No: 50200012345678", LEFT + 10, y + 44, { width: halfW - 20 });
  doc.text("IFSC: HDFC0001234", LEFT + 10, y + 56, { width: halfW - 20 });

  // Signatory (right)
  const sigX = LEFT + halfW + 10;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9).text("AUTHORISED SIGNATORY", sigX, y + 6, { width: halfW - 20 });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Oblique").fontSize(9).text(`For ${cfg.brand_name || "RK Residency"}`, sigX, y + 42, { width: halfW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9).text("_________________________", sigX, y + 52, { width: halfW - 20 });
  doc.text("Front Office Manager", sigX, y + 62, { width: halfW - 20 });
  y += 70 + 6;

  // 8. Terms & conditions
  doc.fillColor(MARSALA).font("Helvetica-Bold").fontSize(9).text("TERMS & CONDITIONS", LEFT, y, { width: CONTENT_W });
  y += 14;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").fontSize(8);
  const tcLines = [
    "1. Computer-generated tax invoice — valid without signature.  2. GST shown as per applicable rates; any change in tax law will be levied extra.",
    "3. Cancellation charges apply as per the booking voucher policy.  4. Check-in: 2:00 PM onwards · Check-out: before 11:00 AM.",
    "5. All disputes are subject to Vrindavan / Mathura jurisdiction only.",
  ];
  for (const line of tcLines) {
    doc.text(line, LEFT, y, { width: CONTENT_W });
    y += 11;
  }

  drawFooter(doc, cfg, 1);
}

// ─── Main route handler ──────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "voucher").toLowerCase();
  if (type !== "voucher" && type !== "invoice") {
    return NextResponse.json({ error: "Invalid type. Use ?type=voucher or ?type=invoice" }, { status: 400 });
  }

  // Admin auth required — guests use /booking-doc/[id] print route
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = (await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: { select: { id: true, name: true, slug: true, view: true, bedType: true, maxGuests: true, sizeSqft: true, basePrice: true, imageUrls: true } },
      guest: true,
    },
  })) as BookingRow | null;

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Load site settings for branding
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["brand_name", "brand_tagline", "phone_primary", "phone_primary_tel", "email_primary", "address_full", "gstin", "website_url"] } },
    select: { key: true, value: true },
  });
  const cfg: Cfg = {};
  settings.forEach((s) => { cfg[s.key] = s.value; });
  // Apply sensible defaults if settings are missing
  cfg.brand_name = cfg.brand_name || "RK Residency";
  cfg.brand_tagline = cfg.brand_tagline || "Heritage Luxury in Vrindavan";
  cfg.phone_primary = cfg.phone_primary || "+91 565 234 5678";
  cfg.email_primary = cfg.email_primary || "reservations@rkresidencyvrindavan.in";
  cfg.address_full = cfg.address_full || "Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121";
  cfg.website_url = cfg.website_url || "www.rkresidencyvrindavan.in";
  cfg.gstin = cfg.gstin || "—";

  // Build PDF
  const doc = new PDFDocument({ size: "A4", margin: 0, info: {
    Title: `${cfg.brand_name} — ${type === "invoice" ? "Tax Invoice" : "Booking Voucher"} — ${booking.referenceCode}`,
    Author: cfg.brand_name,
    Subject: type === "invoice" ? "Tax Invoice (GST)" : "Booking Confirmation Voucher",
    Creator: "RK Residency Booking System",
  } });

  // Collect PDF into a Buffer
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const pdfBuffer: Buffer = await new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    if (type === "invoice") buildInvoice(doc, booking, cfg);
    else buildVoucher(doc, booking, cfg);
    doc.end();
  });

  const filename = `${cfg.brand_name || "RK-Residency"}-${type === "invoice" ? "Tax-Invoice" : "Booking-Voucher"}-${booking.referenceCode}.pdf`.replace(/\s+/g, "-");

  return new NextResponse(pdfBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuffer.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
