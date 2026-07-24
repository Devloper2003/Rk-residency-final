import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { AFM_FONTS } from "@/lib/pdfkit-fonts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// Populate the global font cache so pdfkit never hits the filesystem.
(globalThis as any).__RK_PDFKIT_FONTS__ = AFM_FONTS;

// ─── Brand palette ───────────────────────────────────────────────────
const TEAL = "#0E4C4F";
const TEAL_DEEP = "#0A3A3C";
const GOLD = "#C9A24A";
const GOLD_SOFT = "#D9B978";
const IVORY = "#F5F2ED";
const CHARCOAL = "#231F1C";
const CHARCOAL_SOFT = "#5C534A";
const MARSALA = "#7A2E2E";
const WHITE = "#FFFFFF";

// A4 page geometry (in PDF points, 1 pt = 1/72 inch)
const MM = (mm: number) => mm * 2.83465;
const PAGE_W = 595.28;  // A4 width in PDF points
const PAGE_H = 841.89;  // A4 height in PDF points
const LEFT = MM(15);
const RIGHT = PAGE_W - MM(15);
const CONTENT_W = RIGHT - LEFT;

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
  guest?: { id: string; fullName: string; email: string; phone: string; country?: string | null; city?: string | null } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatINR(n: number): string {
  return "\u20B9 " + n.toLocaleString("en-IN");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

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

/** Fetch logo image bytes from DB (MediaAsset). Returns PNG Buffer or null.
 *  pdfkit only supports PNG/JPEG, so WebP is converted via sharp. */
async function getLogoBuffer(cfg: Cfg): Promise<Buffer | null> {
  const logoUrl = cfg.logo_image_url || "";
  // logo_image_url is like "/uploads/logo-transparent.webp"
  const match = logoUrl.match(/\/uploads\/(.+)$/);
  if (!match) return null;
  const filename = match[1];
  try {
    const asset = await db.mediaAsset.findUnique({
      where: { filename },
      select: { data: true, mimeType: true },
    });
    if (!asset) return null;
    const srcBuf = Buffer.from(asset.data);
    // If already PNG/JPEG, return as-is. Otherwise convert via sharp.
    if (asset.mimeType === "image/png" || asset.mimeType === "image/jpeg") {
      return srcBuf;
    }
    // Convert WebP (or any other format) → PNG with white background
    // (pdfkit can't handle transparency well, so flatten to white).
    const pngBuf = await sharp(srcBuf)
      .flatten({ background: "#0E4C4F" })  // teal background matches header
      .resize(200, 200, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return pngBuf;
  } catch (e) {
    console.error("[booking-pdf] logo fetch/convert failed:", e);
    return null;
  }
}

// ─── Header (shared, with logo) ──────────────────────────────────────

function drawHeader(doc: PDFKit.PDFDocument, cfg: Cfg, label: string, y: number, logoBuffer: Buffer | null): number {
  const HEADER_H = 56;
  doc.rect(LEFT, y, CONTENT_W, HEADER_H).fill(TEAL);
  doc.rect(LEFT, y + HEADER_H, CONTENT_W, 2).fill(GOLD);

  // Logo (left) — embed if available, fits in 40x40 box
  let textX = LEFT + 14;
  if (logoBuffer) {
    try {
      const LOGO_SIZE = 38;
      const logoX = LEFT + 12;
      const logoY = y + (HEADER_H - LOGO_SIZE) / 2;
      doc.image(logoBuffer, logoX, logoY, { fit: [LOGO_SIZE, LOGO_SIZE] });
      textX = logoX + LOGO_SIZE + 8;
    } catch (e) {
      console.error("[booking-pdf] logo embed failed:", e);
    }
  }

  // Brand name + tagline (next to logo)
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(18).text(cfg.brand_name || "RK Residency", textX, y + 12);
  doc.fillColor(GOLD_SOFT).font("Helvetica-Oblique").fontSize(9).text(cfg.brand_tagline || "Heritage Luxury in Vrindavan", textX, y + 34);

  // Document label (right)
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(8).text("DOCUMENT", RIGHT - 200, y + 10, { width: 186, align: "right" });
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(16).text(label, RIGHT - 200, y + 24, { width: 186, align: "right" });

  return y + HEADER_H + 8;
}

function drawFooter(doc: PDFKit.PDFDocument, cfg: Cfg, pageNum: number) {
  // Position the footer near the bottom of the A4 page (842pt tall).
  // pdfkit y-axis: 0 at top, increases downward. So footer y should be ~791.
  const y = PAGE_H - MM(18); // 842 - 51 = 791pt
  doc.lineWidth(0.6).strokeColor(GOLD).moveTo(LEFT, y).lineTo(RIGHT, y).stroke();

  // Footer text BELOW the divider line (so use y + offset, not y - offset).
  doc.fillColor(CHARCOAL_SOFT).fontSize(7.5).font("Helvetica");
  const addr = cfg.address_full || "Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121";
  doc.text(`${cfg.brand_name || "RK Residency"}  ·  ${addr}`, LEFT, y + 6, { width: CONTENT_W * 0.7 });
  doc.text(`Tel: ${cfg.phone_primary || ""}  ·  Email: ${cfg.email_primary || ""}  ·  Web: ${cfg.website_url || ""}`, LEFT, y + 14, { width: CONTENT_W * 0.7 });

  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(7.5);
  if (cfg.gstin) doc.text(`GSTIN: ${cfg.gstin}`, RIGHT - 110, y + 6, { width: 110, align: "right" });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").text(`Page ${pageNum}`, RIGHT - 110, y + 14, { width: 110, align: "right" });

  doc.fillColor("#A39A8C").font("Helvetica-Oblique").fontSize(6.5);
  doc.text("This is a computer-generated document — no signature required.", LEFT, y + 24, { width: CONTENT_W, align: "center" });
}

function drawSectionHeader(doc: PDFKit.PDFDocument, text: string, color: string, x: number, y: number, w: number): number {
  doc.rect(x, y, w, 16).fill(color);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(9).text(text, x + 8, y + 5, { width: w - 16 });
  return y + 16;
}

// ─── Build Voucher PDF ───────────────────────────────────────────────

function buildVoucher(doc: PDFKit.PDFDocument, b: BookingRow, cfg: Cfg, logoBuffer: Buffer | null) {
  let y = MM(12);
  y = drawHeader(doc, cfg, "BOOKING VOUCHER", y, logoBuffer);

  // 1. Reference + dates strip — wider reference column to fit RK-VRD-2026-XXXX
  const REF_STRIP_H = 38;
  doc.rect(LEFT, y, CONTENT_W, REF_STRIP_H).fill(IVORY);
  doc.strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, REF_STRIP_H).stroke();

  // Columns: 40% reference, 30% voucher date, 30% booking date
  const rCols = [CONTENT_W * 0.40, CONTENT_W * 0.30, CONTENT_W * 0.30];
  let cx = LEFT;
  const drawRefStripCol = (label: string, value: string, valueFont: string, valueColor: string, valueSize: number) => {
    doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(8).text(label, cx + 10, y + 7, { width: rCols[0] - 10 });
    doc.fillColor(valueColor).font(valueFont).fontSize(valueSize).text(value, cx + 10, y + 19, { width: rCols[0] - 10 });
    cx += rCols[0];
  };
  drawRefStripCol("BOOKING REFERENCE", b.referenceCode, "Helvetica-Bold", TEAL, 12);
  drawRefStripCol("VOUCHER DATE", fmtDate(new Date()), "Helvetica-Bold", CHARCOAL, 10);
  drawRefStripCol("BOOKING DATE", fmtDate(b.createdAt), "Helvetica-Bold", CHARCOAL, 10);

  // Vertical dividers
  doc.moveTo(LEFT + rCols[0], y).lineTo(LEFT + rCols[0], y + REF_STRIP_H).strokeColor("#D9C8A0").lineWidth(0.3).stroke();
  doc.moveTo(LEFT + rCols[0] + rCols[1], y).lineTo(LEFT + rCols[0] + rCols[1], y + REF_STRIP_H).strokeColor("#D9C8A0").lineWidth(0.3).stroke();

  y += REF_STRIP_H + 6;

  // 2. Status banner
  doc.rect(LEFT, y, CONTENT_W, 22).fill(TEAL_DEEP);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(10).text(
    `STATUS:  ${b.status.replace(/_/g, " ")}    ·    PAYMENT:  ${b.paymentStatus}`,
    LEFT, y + 6, { width: CONTENT_W, align: "center" }
  );
  y += 22 + 8;

  // 3. Guest + Stay details side by side (with wrapping labels)
  const blockW = (CONTENT_W - 6) / 2;
  const guestX = LEFT, stayX = LEFT + blockW + 6;
  const BLOCK_TOP_Y = y;

  // Section headers
  const guestHeadY = drawSectionHeader(doc, "GUEST DETAILS", TEAL, guestX, y, blockW);
  const stayHeadY = drawSectionHeader(doc, "STAY DETAILS", TEAL, stayX, y, blockW);

  // Guest block body
  let guestY = guestHeadY + 6;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("NAME", guestX + 8, guestY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9.5).text(b.guestName, guestX + 8, guestY + 11, { width: blockW - 16 });
  guestY += 26;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("EMAIL", guestX + 8, guestY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(b.guestEmail, guestX + 8, guestY + 11, { width: blockW - 16 });
  guestY += 24;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("PHONE", guestX + 8, guestY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(b.guestPhone, guestX + 8, guestY + 11, { width: blockW - 16 });
  guestY += 24;
  const g = b.guest;
  if (g && (g.city || g.country)) {
    const loc = [g.city, g.country].filter(Boolean).join(", ");
    doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("LOCATION", guestX + 8, guestY, { width: blockW - 16 });
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(loc, guestX + 8, guestY + 11, { width: blockW - 16 });
    guestY += 24;
  }
  const guestBlockH = guestY - BLOCK_TOP_Y;
  doc.strokeColor(GOLD).lineWidth(0.5).rect(guestX, BLOCK_TOP_Y, blockW, guestBlockH).stroke();

  // Stay block body
  let stayY = stayHeadY + 6;
  const roomName = b.room?.name || "—";
  const roomView = b.room?.view || "—";
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("ROOM", stayX + 8, stayY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9.5).text(roomName, stayX + 8, stayY + 11, { width: blockW - 16 });
  stayY += 26;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("VIEW", stayX + 8, stayY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(roomView, stayX + 8, stayY + 11, { width: blockW - 16 });
  stayY += 24;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("CHECK-IN", stayX + 8, stayY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(`${fmtDate(b.checkIn)}  (after 2 PM)`, stayX + 8, stayY + 11, { width: blockW - 16 });
  stayY += 24;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("CHECK-OUT", stayX + 8, stayY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(`${fmtDate(b.checkOut)}  (before 11 AM)`, stayX + 8, stayY + 11, { width: blockW - 16 });
  stayY += 24;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("GUESTS", stayX + 8, stayY, { width: blockW - 16 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(
    `${b.nights} night(s)  ·  ${b.adults} Adult(s)${b.children > 0 ? `, ${b.children} Child(ren)` : ""}`,
    stayX + 8, stayY + 11, { width: blockW - 16 }
  );
  stayY += 24;
  const stayBlockH = stayY - BLOCK_TOP_Y;
  doc.strokeColor(GOLD).lineWidth(0.5).rect(stayX, BLOCK_TOP_Y, blockW, stayBlockH).stroke();

  y += Math.max(guestBlockH, stayBlockH) + 8;

  // 4. Charges summary table
  const chCols = [CONTENT_W * 0.52, CONTENT_W * 0.16, CONTENT_W * 0.12, CONTENT_W * 0.20];
  const chY = y;
  doc.rect(LEFT, chY, CONTENT_W, 18).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  cx = LEFT;
  const chHeads = ["CHARGE DESCRIPTION", "PER NIGHT", "NIGHTS", "AMOUNT"];
  const chAlign = ["left", "right", "right", "right"];
  for (let i = 0; i < 4; i++) {
    doc.text(chHeads[i], cx + 6, chY + 6, { width: chCols[i] - 10, align: chAlign[i] as any });
    cx += chCols[i];
  }

  let rowY = chY + 18;
  const drawChargeRow = (desc: string, perNight: string, nights: string, amount: string, bg: string) => {
    doc.fillColor(bg).rect(LEFT, rowY, CONTENT_W, 18).fill();
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
    cx = LEFT;
    doc.text(desc, cx + 6, rowY + 5, { width: chCols[0] - 10 });
    cx += chCols[0];
    doc.text(perNight, cx + 6, rowY + 5, { width: chCols[1] - 10, align: "right" });
    cx += chCols[1];
    doc.text(nights, cx + 6, rowY + 5, { width: chCols[2] - 10, align: "right" });
    cx += chCols[2];
    doc.text(amount, cx + 6, rowY + 5, { width: chCols[3] - 10, align: "right" });
    rowY += 18;
  };
  drawChargeRow(`Room Tariff — ${roomName}`, formatINR(b.pricePerNight), String(b.nights), formatINR(b.subtotal), WHITE);
  drawChargeRow("GST (12% on room tariff)", "—", "—", formatINR(b.taxesGst), WHITE);
  if (b.serviceFee > 0) drawChargeRow("Service Fee", "—", "—", formatINR(b.serviceFee), WHITE);

  // Grand total row
  doc.fillColor(TEAL_DEEP).rect(LEFT, rowY, CONTENT_W, 22).fill();
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(9.5);
  doc.text("GRAND TOTAL", LEFT + 6, rowY + 7, { width: chCols[0] + chCols[1] + chCols[2] - 10 });
  doc.text(formatINR(b.totalAmount), LEFT + chCols[0] + chCols[1] + chCols[2] + 6, rowY + 7, { width: chCols[3] - 10, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, chY, CONTENT_W, rowY + 22 - chY).stroke();
  y = rowY + 22 + 8;

  // 5. Inclusions
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(
    "Inclusions: Complimentary Satvik Breakfast, Wi-Fi, daily housekeeping, assistance with temple visits, and all applicable taxes.",
    LEFT, y, { width: CONTENT_W }
  );
  y += 24;

  // 6. Special requests
  if (b.specialRequests) {
    y = drawSectionHeader(doc, "SPECIAL REQUESTS", GOLD, LEFT, y, CONTENT_W);
    const reqHeight = 30;
    doc.fillColor(IVORY).rect(LEFT, y, CONTENT_W, reqHeight).fill();
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text(b.specialRequests, LEFT + 8, y + 6, { width: CONTENT_W - 16 });
    doc.strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y - 16, CONTENT_W, reqHeight + 16).stroke();
    y += reqHeight + 8;
  }

  // 7. Cancellation policy
  y = drawSectionHeader(doc, "CANCELLATION POLICY", MARSALA, LEFT, y, CONTENT_W);
  doc.fillColor("#FBF1F1").rect(LEFT, y, CONTENT_W, 42).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
  doc.text(
    "Free cancellation until 7 days before check-in. 50% refund for cancellations 3-6 days before. No refund for cancellations within 48 hours of check-in.",
    LEFT + 8, y + 6, { width: CONTENT_W - 16 }
  );
  doc.strokeColor(MARSALA).lineWidth(0.5).rect(LEFT, y - 16, CONTENT_W, 58).stroke();
  y += 42 + 10;

  // 8. Thank-you note
  const firstName = b.guestName.split(/\s+/)[0] || "Guest";
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11);
  doc.text(`Dear ${firstName}, thank you for choosing ${cfg.brand_name || "RK Residency"}.`, LEFT, y, { width: CONTENT_W });
  y += 18;
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text(
    "Please present this voucher (printed or on your mobile) at the front desk upon arrival, along with a government-issued photo ID for each guest. Our concierge will assist with your luggage, temple tour bookings, and any special arrangements you may need during your stay in the holy land of Vrindavan.",
    LEFT, y, { width: CONTENT_W }
  );

  drawFooter(doc, cfg, 1);
}

// ─── Build Invoice PDF ───────────────────────────────────────────────

function buildInvoice(doc: PDFKit.PDFDocument, b: BookingRow, cfg: Cfg, logoBuffer: Buffer | null) {
  let y = MM(12);
  y = drawHeader(doc, cfg, "TAX INVOICE", y, logoBuffer);

  // 1. Invoice meta strip — wider INVOICE NO and GSTIN columns (avoid overflow)
  // 4 cols: 28% inv no, 22% date, 24% booking ref, 26% GSTIN
  const META_H = 36;
  const mCols = [CONTENT_W * 0.28, CONTENT_W * 0.22, CONTENT_W * 0.24, CONTENT_W * 0.26];
  doc.rect(LEFT, y, CONTENT_W, META_H).fill(IVORY);
  doc.strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, META_H).stroke();

  const invNo = `INV-${b.referenceCode.split("-").slice(-2).join("-")}`;
  const metaLabels = ["INVOICE NO.", "INVOICE DATE", "BOOKING REF.", "GSTIN"];
  const metaValues = [invNo, fmtDate(b.createdAt), b.referenceCode, cfg.gstin || "—"];
  let mx = LEFT;
  for (let i = 0; i < 4; i++) {
    doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text(metaLabels[i], mx + 8, y + 7, { width: mCols[i] - 12 });
    doc.fillColor(i === 0 ? TEAL : CHARCOAL).font("Helvetica-Bold").fontSize(i === 0 ? 11 : 9.5).text(metaValues[i], mx + 8, y + 19, { width: mCols[i] - 12 });
    if (i < 3) doc.moveTo(mx + mCols[i], y).lineTo(mx + mCols[i], y + META_H).strokeColor("#D9C8A0").lineWidth(0.3).stroke();
    mx += mCols[i];
  }
  y += META_H + 6;

  // 2. Billed From / Billed To — taller box (90pt) with all rows
  const billW = (CONTENT_W - 6) / 2;
  const BILL_H = 90;
  doc.rect(LEFT, y, CONTENT_W, BILL_H).fill(WHITE).strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, BILL_H).stroke();
  doc.moveTo(LEFT + billW, y).lineTo(LEFT + billW, y + BILL_H).strokeColor("#D9C8A0").lineWidth(0.3).stroke();

  // Billed From (left)
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("BILLED FROM", LEFT + 10, y + 8, { width: billW - 20 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11).text(cfg.brand_name || "RK Residency", LEFT + 10, y + 22, { width: billW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
  doc.text(cfg.address_full || "", LEFT + 10, y + 38, { width: billW - 20 });
  doc.text(`Tel: ${cfg.phone_primary || ""}`, LEFT + 10, y + 52, { width: billW - 20 });
  doc.text(`Email: ${cfg.email_primary || ""}`, LEFT + 10, y + 66, { width: billW - 20 });
  doc.text(`GSTIN: ${cfg.gstin || "—"}`, LEFT + 10, y + 80, { width: billW - 20 });

  // Billed To (right)
  const rightX = LEFT + billW + 10;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("BILLED TO", rightX, y + 8, { width: billW - 20 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(11).text(b.guestName, rightX, y + 22, { width: billW - 20 });
  const g = b.guest;
  const gAddr = g && (g.city || g.country) ? [g.city, g.country].filter(Boolean).join(", ") : "";
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
  if (gAddr) doc.text(gAddr, rightX, y + 38, { width: billW - 20 });
  doc.text(`Tel: ${b.guestPhone}`, rightX, y + 52, { width: billW - 20 });
  doc.text(`Email: ${b.guestEmail}`, rightX, y + 66, { width: billW - 20 });
  y += BILL_H + 6;

  // 3. Stay summary (multi-line friendly)
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
  doc.text(
    `Stay: ${b.room?.name || "—"} (${b.room?.view || "—"})    ·    Check-in: ${fmtDate(b.checkIn)}    ·    Check-out: ${fmtDate(b.checkOut)}    ·    ${b.nights} night(s)    ·    ${b.adults} Adult(s)${b.children > 0 ? `, ${b.children} Child(ren)` : ""}`,
    LEFT, y, { width: CONTENT_W }
  );
  y += 18;

  // 4. Line items table — better column widths
  // 6 cols: # (4%), Description (42%), HSN/SAC (12%), QTY (10%), RATE (16%), AMOUNT (16%)
  const itCols = [CONTENT_W * 0.04, CONTENT_W * 0.42, CONTENT_W * 0.12, CONTENT_W * 0.10, CONTENT_W * 0.16, CONTENT_W * 0.16];
  const itY = y;
  doc.rect(LEFT, itY, CONTENT_W, 18).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  const itHeads = ["#", "DESCRIPTION", "HSN/SAC", "QTY", "RATE", "AMOUNT"];
  const itAlign = ["center", "left", "center", "right", "right", "right"];
  let cx = LEFT;
  for (let i = 0; i < 6; i++) {
    doc.text(itHeads[i], cx + 4, itY + 6, { width: itCols[i] - 8, align: itAlign[i] as any });
    cx += itCols[i];
  }

  let rowY = itY + 18;
  // Item row (taller to fit description + subline)
  doc.fillColor(WHITE).rect(LEFT, rowY, CONTENT_W, 26).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  cx = LEFT;
  doc.text("1", cx + 4, rowY + 5, { width: itCols[0] - 8, align: "center" }); cx += itCols[0];
  doc.text(`${b.room?.name || "Room"} — ${b.room?.view || "—"}`, cx + 4, rowY + 4, { width: itCols[1] - 8 });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").fontSize(7).text(`Room tariff @ ${formatINR(b.pricePerNight)}/night, ${b.nights} night(s)`, cx + 4, rowY + 15, { width: itCols[1] - 8 });
  cx += itCols[1];
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9).text("996331", cx + 4, rowY + 5, { width: itCols[2] - 8, align: "center" }); cx += itCols[2];
  doc.text(`${b.nights} N`, cx + 4, rowY + 5, { width: itCols[3] - 8, align: "right" }); cx += itCols[3];
  doc.text(formatINR(b.pricePerNight), cx + 4, rowY + 5, { width: itCols[4] - 8, align: "right" }); cx += itCols[4];
  doc.text(formatINR(b.subtotal), cx + 4, rowY + 5, { width: itCols[5] - 8, align: "right" });
  rowY += 26;

  // Subtotal row
  const subtotalLabelW = itCols[1] + itCols[2] + itCols[3] + itCols[4];
  doc.fillColor(IVORY).rect(LEFT, rowY, CONTENT_W, 18).fill();
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9);
  doc.text("Subtotal (Taxable Value)", LEFT + itCols[0] + 4, rowY + 5, { width: subtotalLabelW - 8 });
  doc.text(formatINR(b.subtotal), LEFT + itCols[0] + subtotalLabelW + 4, rowY + 5, { width: itCols[5] - 8, align: "right" });
  rowY += 18;

  // CGST row
  const cgst = Math.floor(b.taxesGst / 2);
  const sgst = b.taxesGst - cgst;
  doc.fillColor(WHITE).rect(LEFT, rowY, CONTENT_W, 16).fill();
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(9);
  doc.text("CGST @ 6%", LEFT + itCols[0] + 4, rowY + 4, { width: subtotalLabelW - 8 });
  doc.text(formatINR(cgst), LEFT + itCols[0] + subtotalLabelW + 4, rowY + 4, { width: itCols[5] - 8, align: "right" });
  rowY += 16;

  // SGST row
  doc.fillColor(WHITE).rect(LEFT, rowY, CONTENT_W, 16).fill();
  doc.text("SGST @ 6%", LEFT + itCols[0] + 4, rowY + 4, { width: subtotalLabelW - 8 });
  doc.text(formatINR(sgst), LEFT + itCols[0] + subtotalLabelW + 4, rowY + 4, { width: itCols[5] - 8, align: "right" });
  rowY += 16;

  if (b.serviceFee > 0) {
    doc.fillColor(WHITE).rect(LEFT, rowY, CONTENT_W, 16).fill();
    doc.text("Service Fee", LEFT + itCols[0] + 4, rowY + 4, { width: subtotalLabelW - 8 });
    doc.text(formatINR(b.serviceFee), LEFT + itCols[0] + subtotalLabelW + 4, rowY + 4, { width: itCols[5] - 8, align: "right" });
    rowY += 16;
  }

  // Grand total row
  doc.fillColor(TEAL_DEEP).rect(LEFT, rowY, CONTENT_W, 22).fill();
  doc.fillColor(GOLD_SOFT).font("Helvetica-Bold").fontSize(9.5);
  doc.text("GRAND TOTAL", LEFT + itCols[0] + 4, rowY + 7, { width: itCols[1] + itCols[2] - 8 });
  doc.text(`${b.nights} N`, LEFT + itCols[0] + itCols[1] + itCols[2] + 4, rowY + 7, { width: itCols[3] - 8, align: "right" });
  doc.text(formatINR(b.totalAmount), LEFT + itCols[0] + itCols[1] + itCols[2] + itCols[3] + 4, rowY + 7, { width: itCols[4] + itCols[5] - 8, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, itY, CONTENT_W, rowY + 22 - itY).stroke();
  y = rowY + 22 + 6;

  // 5. Amount in words
  const words = amountInWords(b.totalAmount);
  const WORDS_H = 22;
  doc.fillColor(IVORY).rect(LEFT, y, CONTENT_W, WORDS_H).fill();
  doc.strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, WORDS_H).stroke();
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Bold").fontSize(7).text("GRAND TOTAL (IN WORDS)", LEFT + 10, y + 4, { width: 110 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(10.5).text(`Rupees ${words} Only`, LEFT + 130, y + 6, { width: CONTENT_W - 140 });
  y += WORDS_H + 6;

  // 6. Payment status — 4 cols (28% / 24% / 24% / 24%)
  const payCols = [CONTENT_W * 0.28, CONTENT_W * 0.24, CONTENT_W * 0.24, CONTENT_W * 0.24];
  const payY = y;
  doc.rect(LEFT, payY, CONTENT_W, 18).fill(TEAL);
  doc.fillColor("#F5F2ED").font("Helvetica-Bold").fontSize(8.5);
  const payHeads = ["PAYMENT STATUS", "AMOUNT PAID", "BALANCE DUE", "TOTAL"];
  const payAlign = ["left", "right", "right", "right"];
  cx = LEFT;
  for (let i = 0; i < 4; i++) {
    doc.text(payHeads[i], cx + 6, payY + 6, { width: payCols[i] - 10, align: payAlign[i] as any });
    cx += payCols[i];
  }
  // body row
  const amountPaid = b.paymentStatus === "PAID" ? b.totalAmount : 0;
  const balance = b.totalAmount - amountPaid;
  doc.fillColor(WHITE).rect(LEFT, payY + 18, CONTENT_W, 22).fill();
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9).text(b.paymentStatus, LEFT + 6, payY + 24, { width: payCols[0] - 10 });
  doc.font("Helvetica").text(formatINR(amountPaid), LEFT + payCols[0] + 6, payY + 24, { width: payCols[1] - 10, align: "right" });
  doc.fillColor(MARSALA).font("Helvetica-Bold").text(formatINR(balance), LEFT + payCols[0] + payCols[1] + 6, payY + 24, { width: payCols[2] - 10, align: "right" });
  doc.fillColor(TEAL).font("Helvetica-Bold").text(formatINR(b.totalAmount), LEFT + payCols[0] + payCols[1] + payCols[2] + 6, payY + 24, { width: payCols[3] - 10, align: "right" });
  doc.strokeColor(TEAL).lineWidth(0.5).rect(LEFT, payY, CONTENT_W, 40).stroke();
  y = payY + 40 + 6;

  // 7. Bank details + signature
  const halfW = (CONTENT_W - 6) / 2;
  const BANK_H = 76;
  doc.rect(LEFT, y, CONTENT_W, BANK_H).fill(WHITE).strokeColor(GOLD).lineWidth(0.5).rect(LEFT, y, CONTENT_W, BANK_H).stroke();
  doc.moveTo(LEFT + halfW, y).lineTo(LEFT + halfW, y + BANK_H).strokeColor("#D9C8A0").lineWidth(0.3).stroke();

  // Bank details (left) — split heading to fit
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9).text("BANK DETAILS", LEFT + 10, y + 8, { width: halfW - 20 });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").fontSize(7).text("(for balance payment)", LEFT + 10, y + 21, { width: halfW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
  doc.text(`Beneficiary: ${cfg.brand_name || "RK Residency"} Pvt. Ltd.`, LEFT + 10, y + 34, { width: halfW - 20 });
  doc.text("Bank: HDFC Bank, Vrindavan Branch", LEFT + 10, y + 47, { width: halfW - 20 });
  doc.text("A/C No: 50200012345678", LEFT + 10, y + 60, { width: halfW - 20 });
  doc.text("IFSC: HDFC0001234  ·  UPI: rkresidency@hdfcbank", LEFT + 10, y + 73, { width: halfW - 20 });

  // Signatory (right)
  const sigX = LEFT + halfW + 10;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9).text("AUTHORISED SIGNATORY", sigX, y + 8, { width: halfW - 20 });
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica-Oblique").fontSize(8.5).text(`For ${cfg.brand_name || "RK Residency"}`, sigX, y + 50, { width: halfW - 20 });
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(8.5).text("_________________________", sigX, y + 60, { width: halfW - 20 });
  doc.text("Front Office Manager", sigX, y + 70, { width: halfW - 20 });
  y += BANK_H + 6;

  // 8. Terms & conditions
  doc.fillColor(MARSALA).font("Helvetica-Bold").fontSize(8.5).text("TERMS & CONDITIONS", LEFT, y, { width: CONTENT_W });
  y += 13;
  doc.fillColor(CHARCOAL_SOFT).font("Helvetica").fontSize(7.5);
  const tcLines = [
    "1. Computer-generated tax invoice — valid without signature.    2. GST shown as per applicable rates; any change in tax law will be levied extra.",
    "3. Cancellation charges apply as per the booking voucher policy.    4. Check-in: 2:00 PM onwards  ·  Check-out: before 11:00 AM.",
    "5. All disputes are subject to Vrindavan / Mathura jurisdiction only.",
  ];
  for (const line of tcLines) {
    doc.text(line, LEFT, y, { width: CONTENT_W });
    y += 10;
  }

  drawFooter(doc, cfg, 1);
}

// ─── Main route handler ──────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const url = new URL(req.url);
    const type = (url.searchParams.get("type") || "voucher").toLowerCase();
    if (type !== "voucher" && type !== "invoice") {
      return NextResponse.json({ error: "Invalid type. Use ?type=voucher or ?type=invoice" }, { status: 400 });
    }

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

    // Load site settings (including logo_image_url)
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ["brand_name", "brand_tagline", "phone_primary", "phone_primary_tel", "email_primary", "address_full", "gstin", "website_url", "logo_image_url"] } },
      select: { key: true, value: true },
    });
    const cfg: Cfg = {};
    settings.forEach((s) => { cfg[s.key] = s.value; });
    cfg.brand_name = cfg.brand_name || "RK Residency";
    cfg.brand_tagline = cfg.brand_tagline || "Heritage Luxury in Vrindavan";
    cfg.phone_primary = cfg.phone_primary || "+91 565 234 5678";
    cfg.email_primary = cfg.email_primary || "reservations@rkresidencyvrindavan.in";
    cfg.address_full = cfg.address_full || "Krishna Janambhoomi Road, Vrindavan, Mathura, Uttar Pradesh 281121";
    cfg.website_url = cfg.website_url || "www.rkresidencyvrindavan.in";
    cfg.gstin = cfg.gstin || "—";

    // Load logo from DB (if logo_image_url points to /uploads/...)
    const logo = await getLogoBuffer(cfg);

    // Build PDF
    let pdfBuffer: Buffer;
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, info: {
        Title: `${cfg.brand_name} — ${type === "invoice" ? "Tax Invoice" : "Booking Voucher"} — ${booking.referenceCode}`,
        Author: cfg.brand_name,
        Subject: type === "invoice" ? "Tax Invoice (GST)" : "Booking Confirmation Voucher",
        Creator: "RK Residency Booking System",
      } });

      pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on("data", (c: Buffer) => chunks.push(c));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (e: Error) => reject(e));
        try {
          if (type === "invoice") buildInvoice(doc, booking, cfg, logo);
          else buildVoucher(doc, booking, cfg, logo);
          doc.end();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    } catch (pdfErr) {
      console.error("[booking-pdf] PDF generation failed:", pdfErr);
      return NextResponse.json({
        error: "PDF generation failed",
        detail: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
      }, { status: 500 });
    }

    const filename = `${cfg.brand_name || "RK-Residency"}-${type === "invoice" ? "Tax-Invoice" : "Booking-Voucher"}-${booking.referenceCode}.pdf`.replace(/\s+/g, "-");

    const arrayBuf = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer;

    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[booking-pdf] route error:", e);
    return NextResponse.json({
      error: "Server error",
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
