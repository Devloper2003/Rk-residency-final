/**
 * doc-pdf.ts — RK Residency Invoice & Booking Voucher PDF builders.
 *
 * ONE shared design (owner-approved artwork, Oct 2026): cream page, gold frame,
 * ॥ श्री राधे ॥ motif, RK monogram, deep-green + gold palette.
 * Used by ALL three document routes so guests, admin and email links see the
 * exact same design:
 *   /api/invoice/[referenceCode]   (guest, from email links)
 *   /api/voucher/[referenceCode]   (guest, from email links)
 *   /api/booking-pdf/[bookingId]   (admin panel downloads)
 *
 * Font notes:
 *  - Standard PDF fonts (Helvetica/Times) lack the ₹ (U+20B9) glyph and cannot
 *    shape Devanagari. We therefore embed DejaVu Serif/Sans (₹-capable) as
 *    base64 TTFs from pdfkit-ttf.ts, and the ॥ श्री राधे ॥ motif is pre-shaped
 *    as a transparent gold PNG (PDFKit does no complex text shaping).
 *  - AFM font metrics are injected into pdfkit's global cache so the standard
 *    fonts also work on Vercel's serverless filesystem (same trick the old
 *    booking-pdf route used).
 */
import PDFDocument from "pdfkit";
import { AFM_FONTS } from "@/lib/pdfkit-fonts";
import {
  TTF_SERIF, TTF_SERIF_BOLD, TTF_SANS, TTF_SANS_BOLD, TTF_SERIF_ITALIC, MOTIF_PNG,
} from "@/lib/pdfkit-ttf";
import { modeLabel, paidAmountOf } from "@/lib/payment-modes";

// Inject standard-font metrics once per process (Vercel safety).
const g = globalThis as any;
if (!g.__RK_PDFKIT_FONTS__) g.__RK_PDFKIT_FONTS__ = AFM_FONTS;

/* ── Page geometry (A4 points) ── */
const PW = 595.28;
const PH = 841.89;
const FRAME = 22;                       // gold frame inset
const L = 54;                           // content left
const R = PW - 54;                      // content right (541.28)
const CW = R - L;                       // content width (487.28)

/* ── Palette (from owner's artwork) ── */
const PAGE = "#FBF9F1";
const GREEN = "#1D5B45";
const GREEN_DEEP = "#16493A";
const GOLD = "#B9974C";
const INK = "#2A352E";
const GRAY = "#78756B";
const LINE = "#D9D3BF";                 // olive hairline
const SAGE = "#EFF3E2";                 // light green panel
const SAGE_LINE = "#D9E0C5";
const WHITE = "#FFFFFF";

/* ── Lazy-decoded font buffers (decoded once per process) ── */
let cache: Record<string, Buffer> | null = null;
function buffers(): Record<string, Buffer> {
  if (!cache) {
    cache = {
      Serif: Buffer.from(TTF_SERIF, "base64"),
      "Serif-Bold": Buffer.from(TTF_SERIF_BOLD, "base64"),
      "Serif-Italic": Buffer.from(TTF_SERIF_ITALIC, "base64"),
      Sans: Buffer.from(TTF_SANS, "base64"),
      "Sans-Bold": Buffer.from(TTF_SANS_BOLD, "base64"),
      Motif: Buffer.from(MOTIF_PNG, "base64"),
    };
  }
  return cache;
}

export type Cfg = Record<string, string>;

export interface DocBooking {
  referenceCode: string;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string | null;
  planName?: string | null;
  pricePerNight: number;
  subtotal: number;
  taxesGst: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAmount: number;
}

export interface DocData {
  booking: DocBooking;
  roomName: string;
  bedType?: string | null;
  cfg: Cfg; // brand_name, phone_primary, email_primary, address_full, gstin, bank_upi_id
}

/* ── Settings keys + defaults (shared by every doc route) ── */
export const DOC_SETTING_KEYS = [
  "brand_name", "brand_tagline", "phone_primary", "email_primary",
  "address_full", "gstin", "bank_upi_id",
];

export function buildDocCfg(rows: { key: string; value: string }[]): Cfg {
  const cfg: Cfg = {};
  rows.forEach((s) => { cfg[s.key] = s.value; });
  cfg.brand_name = cfg.brand_name || "RK Residency";
  cfg.brand_tagline = cfg.brand_tagline || "Boutique Hotel · Vrindavan";
  cfg.phone_primary = cfg.phone_primary || "+91 9760814931";
  cfg.email_primary = cfg.email_primary || "rkresiddency121@gmail.com";
  cfg.address_full = cfg.address_full || "Near Shani Dev Mandir, Kailash Nagar, Vrindavan, Uttar Pradesh 281121";
  cfg.gstin = cfg.gstin || "09GUJPS8343M1ZK";
  return cfg;
}

/* ── Formatters ── */
function fmtShort(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
/** ₹3,150.00 */
function m2(n: number): string {
  return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
/** ₹3,150 */
function m0(n: number): string {
  return "\u20B9" + Math.round(n).toLocaleString("en-IN");
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

/* ── Low-level draw helpers ── */
type Doc = InstanceType<typeof PDFDocument>;

function newDoc(d: DocData, kind: "invoice" | "voucher"): Doc {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `RK Residency — ${kind === "invoice" ? "Invoice" : "Booking Voucher"} — ${d.booking.referenceCode}`,
      Author: "RK Residency",
      Subject: kind === "invoice" ? "Tax Invoice (GST)" : "Booking Confirmation Voucher",
      Creator: "RK Residency Booking System",
    },
  });
  const b = buffers();
  doc.registerFont("Serif", b.Serif);
  doc.registerFont("Serif-Bold", b["Serif-Bold"]);
  doc.registerFont("Serif-Italic", b["Serif-Italic"]);
  doc.registerFont("Sans", b.Sans);
  doc.registerFont("Sans-Bold", b["Sans-Bold"]);
  return doc;
}

/** Cream page + thin gold frame + gold top bar + ॥ श्री राधे ॥ motif. */
function drawPage(doc: Doc): number {
  doc.rect(0, 0, PW, PH).fill(PAGE);
  // gold top bar
  doc.rect(FRAME, FRAME, PW - FRAME * 2, 3.2).fill(GOLD);
  // thin gold frame
  doc.rect(FRAME, FRAME, PW - FRAME * 2, PH - FRAME * 2)
    .lineWidth(0.9).strokeColor(GOLD).stroke();
  // motif image centered
  const b = buffers();
  const img: any = (doc as any).openImage(b.Motif);
  const w = 118;
  const h = (img.height / img.width) * w;
  doc.image(img, (PW - w) / 2, FRAME + 12, { width: w });
  return FRAME + 12 + h + 4; // y below motif
}

/**
 * Shared brand header. Returns the y where body content starts.
 * Right side = document title + meta rows (invoice) or title + no/date + badge (voucher).
 */
function drawHeader(doc: Doc, d: DocData, y: number, opts: {
  title: string;
  metaRows?: [string, string][];
  subLine?: string;
  badge?: string;
  addressSingleLine?: boolean;
}): number {
  // Monogram
  const cx = L + 20, cy = y + 22;
  doc.circle(cx, cy, 19).fill(GREEN);
  doc.circle(cx, cy, 15.6).lineWidth(0.7).strokeColor(GOLD).stroke();
  doc.font("Serif-Bold").fontSize(12.5).fillColor(GOLD)
    .text("RK", cx - 15, cy - 6.5, { width: 30, align: "center", lineGap: 0 });

  // Brand
  doc.font("Serif-Bold").fontSize(22).fillColor(GREEN)
    .text(d.cfg.brand_name || "RK Residency", L + 48, y - 2, { lineGap: 0 });
  doc.font("Sans").fontSize(6.8).fillColor(GOLD)
    .text("B O U T I Q U E   H O T E L   \u00B7   V R I N D A V A N", L + 48.5, y + 24, { lineGap: 0 });

  // Right block — title (sized so long titles never crowd the brand name)
  doc.font("Serif-Bold").fontSize(opts.title.length > 10 ? 15.5 : 25).fillColor("#22332B")
    .text(opts.title, L + 252, y - 2, { width: R - L - 252, align: "right", characterSpacing: opts.title.length > 10 ? 1.2 : 2, lineGap: 0 });

  let ry = y + 22;
  if (opts.metaRows) {
    // two-column mini rows: gray label left, dark value right (right-aligned block)
    doc.font("Sans").fontSize(7.6);
    for (const [label, value] of opts.metaRows) {
      doc.fillColor(GRAY).text(label, 400, ry, { width: 76, align: "left", lineGap: 0 });
      doc.fillColor(INK).font("Sans").fontSize(7.6)
        .text(value, 300, ry, { width: R - 300, align: "right", lineGap: 0 });
      doc.font("Sans");
      ry += 12.5;
    }
  }
  if (opts.subLine) {
    doc.font("Sans").fontSize(7.6).fillColor(GRAY)
      .text(opts.subLine, L, ry + 1, { width: CW, align: "right", lineGap: 0 });
    ry += 13;
  }
  if (opts.badge) {
    const bw = doc.widthOfString(opts.badge) + 22;
    doc.roundedRect(R - bw, ry + 2, bw, 16, 3)
      .lineWidth(1.1).strokeColor(GREEN).stroke();
    doc.font("Sans-Bold").fontSize(7.4).fillColor(GREEN)
      .text(opts.badge, R - bw, ry + 7, { width: bw, align: "center", characterSpacing: 1.6, lineGap: 0 });
    ry += 22;
  }

  // Address block
  const addr = d.cfg.address_full || "";
  if (opts.addressSingleLine) {
    doc.font("Sans").fontSize(6.5).fillColor(GRAY)
      .text(
        `${addr}  \u00B7  Ph: ${d.cfg.phone_primary}  \u00B7  ${d.cfg.email_primary}  \u00B7  GSTIN: ${d.cfg.gstin}`,
        L, Math.max(ry + 4, y + 40), { width: CW, align: "center", lineGap: 0 }
      );
  } else {
    const ax = L, ay = y + 40;
    doc.font("Sans").fontSize(7.4).fillColor(GRAY).text(addr, ax, ay, { lineGap: 0 });
    doc.text(`Ph: ${d.cfg.phone_primary}  \u00B7  ${d.cfg.email_primary}`, ax, ay + 11, { lineGap: 0 });
    doc.text(`GSTIN: ${d.cfg.gstin}`, ax, ay + 22, { lineGap: 0 });
  }

  // gold divider
  const divY = Math.max(y + 78, ry + 26);
  doc.save().moveTo(L, divY).lineTo(R, divY)
    .lineWidth(0.8).strokeColor(GOLD).stroke().restore();

  return divY + 14;
}

function goldLabel(doc: Doc, text: string, x: number, y: number, size = 7.2): void {
  doc.font("Sans-Bold").fontSize(size).fillColor(GOLD)
    .text(text, x, y, { characterSpacing: 1.7, lineGap: 0 });
}

function hline(doc: Doc, x1: number, x2: number, y: number, color = LINE, w = 0.6): void {
  doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke().restore();
}

function vline(doc: Doc, x: number, y1: number, y2: number, color = SAGE_LINE, w = 0.6): void {
  doc.save().moveTo(x, y1).lineTo(x, y2).lineWidth(w).strokeColor(color).stroke().restore();
}

function drawSignatures(doc: Doc, d: DocData, y: number): void {
  doc.font("Sans").fontSize(7.4).fillColor(GRAY)
    .text("Guest signature", L, y, { lineGap: 0 });
  doc.save().moveTo(R - 130, y - 8).lineTo(R, y - 8)
    .lineWidth(0.6).strokeColor("#9C988B").stroke().restore();
  doc.font("Sans").fontSize(7.4).fillColor(GRAY)
    .text("Authorised signatory", R - 130, y, { width: 130, align: "center", lineGap: 0 });
  doc.text(d.cfg.brand_name || "RK Residency", R - 130, y + 11, { width: 130, align: "center", lineGap: 0 });
}

function drawRadheFooter(doc: Doc, line: string, note: string, y: number): void {
  doc.font("Serif-Italic").fontSize(12).fillColor(GREEN_DEEP)
    .text(line, FRAME, y, { width: PW - FRAME * 2, align: "center", lineGap: 0 });
  doc.font("Sans").fontSize(6.3).fillColor("#98948A")
    .text(note, FRAME, y + 19, { width: PW - FRAME * 2, align: "center", lineGap: 0 });
}

/* ═══════════════════════════ INVOICE ═══════════════════════════ */

export function buildInvoicePdf(d: DocData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = newDoc(d, "invoice");
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      let y = drawPage(doc);
      y = drawHeader(doc, d, y, {
        title: "INVOICE",
        metaRows: [
          ["Invoice No.", d.booking.referenceCode],
          ["Date", fmtShort(new Date())],
          ["Payment", modeLabel(d.booking.paymentMethod)],
        ],
      });

      /* Billed to / booking details */
      goldLabel(doc, "BILLED TO", L, y);
      goldLabel(doc, "BOOKING DETAILS", L + 262, y);
      let by = y + 14;
      doc.font("Serif-Bold").fontSize(13.5).fillColor(INK)
        .text(d.booking.guestName, L, by, { lineGap: 0 });
      doc.font("Sans").fontSize(8.4).fillColor("#57544B");
      doc.text(d.booking.guestEmail, L, by + 19, { lineGap: 0 });
      doc.text(d.booking.guestPhone, L, by + 31, { lineGap: 0 });

      const bx = L + 262;
      doc.font("Sans").fontSize(8.4).fillColor(INK);
      doc.text(`Booking ID:  ${d.booking.referenceCode}`, bx, by + 2, { lineGap: 0 });
      doc.text(`Guests:  ${d.booking.adults} Adults${d.booking.children > 0 ? `, ${d.booking.children} Child` : ""}`, bx, by + 14, { lineGap: 0 });
      doc.text(`Source:  Direct \u2014 Website`, bx, by + 26, { lineGap: 0 });

      /* Stay band */
      const bandY = by + 50;
      doc.rect(L, bandY, CW, 34).fill(SAGE);
      const cells: [string, string, number][] = [
        ["CHECK-IN", `${fmtShort(new Date(d.booking.checkIn))}, 12:00 PM`, 150],
        ["CHECK-OUT", `${fmtShort(new Date(d.booking.checkOut))}, 11:00 AM`, 150],
        ["ROOM", d.roomName, 117],
        ["NIGHTS", String(d.booking.nights || 1), CW - 417],
      ];
      let cx = L;
      cells.forEach(([label, value, w], i) => {
        if (i > 0) vline(doc, cx, bandY, bandY + 34);
        goldLabel(doc, label, cx + 9, bandY + 6, 5.9);
        doc.font("Sans").fontSize(8.6).fillColor(INK)
          .text(value, cx + 9, bandY + 17, { width: w - 14, lineGap: 0, ellipsis: true });
        cx += w;
      });

      /* Items table */
      const subtotal = d.booking.subtotal || d.booking.totalAmount;
      const gross = Math.round(d.booking.pricePerNight * (d.booking.nights || 1));
      const discount = Math.max(gross - subtotal, 0);
      const gst = d.booking.taxesGst || Math.round(subtotal * 0.05);
      const cgst = Math.floor(gst / 2);
      const sgst = gst - cgst;
      const paid = paidAmountOf(d.booking);
      const balance = Math.max(d.booking.totalAmount - paid, 0);

      let ty = bandY + 34 + 14;
      doc.rect(L, ty, CW, 19).fill(GREEN);
      doc.font("Sans-Bold").fontSize(6.8).fillColor(WHITE);
      const thY = ty + 6.5;
      doc.text("DESCRIPTION", L + 9, thY, { characterSpacing: 1.4, lineGap: 0 });
      doc.text("QTY", 316, thY, { width: 40, align: "center", characterSpacing: 1.4, lineGap: 0 });
      doc.text("RATE (\u20B9)", 384, thY, { width: 68, align: "right", characterSpacing: 1.4, lineGap: 0 });
      doc.text("AMOUNT (\u20B9)", R - 78, thY, { width: 70, align: "right", characterSpacing: 1.4, lineGap: 0 });

      interface Row { desc: string; qty: string; rate: string; amount: string }
      const rows: Row[] = [
        {
          desc: `Room tariff \u2013 ${d.roomName}`,
          qty: String(d.booking.nights || 1),
          rate: Math.round(d.booking.pricePerNight).toLocaleString("en-IN"),
          amount: m2(gross),
        },
      ];
      if (d.booking.serviceFee > 0) {
        rows.push({ desc: "Extra bed / breakfast & services", qty: "1", rate: m0(d.booking.serviceFee), amount: m2(d.booking.serviceFee) });
      }
      if (discount > 0) {
        rows.push({ desc: "Discount (coupon)", qty: "\u2014", rate: "\u2014", amount: `\u2212${m2(discount)}` });
      }

      let ry = ty + 19;
      for (const r of rows) {
        const rowH = 21;
        doc.font("Serif").fontSize(9.2).fillColor(INK)
          .text(r.desc, L + 9, ry + 6, { width: 250, lineGap: 0, ellipsis: true });
        doc.font("Sans").fontSize(8.4).fillColor("#57544B");
        doc.text(r.qty, 316, ry + 7, { width: 40, align: "center", lineGap: 0 });
        doc.text(r.rate, 384, ry + 7, { width: 68, align: "right", lineGap: 0 });
        doc.text(r.amount, R - 78, ry + 7, { width: 70, align: "right", lineGap: 0 });
        ry += rowH;
        hline(doc, L, R, ry);
      }

      /* Amount in words + terms (left) & totals (right) */
      let sy = ry + 18;
      goldLabel(doc, "AMOUNT IN WORDS", L, sy);
      doc.font("Serif-Italic").fontSize(9.8).fillColor(INK)
        .text(`Rupees ${amountInWords(d.booking.totalAmount)} Only`, L, sy + 12, { width: 268, lineGap: 0 });

      let tly = sy + 44;
      goldLabel(doc, "TERMS", L, tly);
      doc.font("Sans").fontSize(7.6).fillColor("#57544B");
      const terms = [
        "1.  Check-in 12:00 PM, check-out 11:00 AM.",
        "2.  Valid photo ID is mandatory for all guests.",
        "3.  Advance is non-refundable within 48 hours of arrival.",
        "4.  Balance payable by UPI / Cash / Card at reception.",
      ];
      let lineY = tly + 13;
      for (const t of terms) {
        doc.text(t, L, lineY, { width: 268, lineGap: 0 });
        lineY += 12;
      }

      /* Totals (right column) */
      const tx = L + 262; // 316
      const txW = R - tx; // 225
      let cy2 = sy;
      const trow = (label: string, value: string, opts2?: { bold?: boolean; size?: number; vColor?: string; gap?: number }) => {
        const size = opts2?.size ?? 8.4;
        doc.font(opts2?.bold ? "Sans-Bold" : "Sans").fontSize(size)
          .fillColor(opts2?.bold ? INK : "#57544B")
          .text(label, tx, cy2, { lineGap: 0 });
        doc.font(opts2?.bold ? "Sans-Bold" : "Sans").fontSize(size)
          .fillColor(opts2?.vColor ?? INK)
          .text(value, tx, cy2, { width: txW, align: "right", lineGap: 0 });
        cy2 += opts2?.gap ?? 15;
      };
      trow("Subtotal", m2(gross));
      trow("Discount (\u20B9)", String(discount));
      trow("GST (5%)", m2(gst));
      trow("CGST + SGST (half each)", `${m2(cgst)} + ${m2(sgst)}`, { size: 7.8, gap: 17 });

      // green rule + total
      doc.save().moveTo(tx, cy2).lineTo(R, cy2).lineWidth(1.3).strokeColor(GREEN).stroke().restore();
      cy2 += 8;
      doc.font("Serif-Bold").fontSize(13).fillColor(INK).text("Total", tx, cy2, { lineGap: 0 });
      doc.font("Serif-Bold").fontSize(14).fillColor(GREEN)
        .text(m2(d.booking.totalAmount), tx, cy2 - 1, { width: txW, align: "right", lineGap: 0 });
      cy2 += 22;

      trow("Advance paid (\u20B9)", m0(paid), { gap: 17 });
      // balance band
      doc.rect(tx, cy2, txW, 21).fill(SAGE);
      doc.font("Sans-Bold").fontSize(8).fillColor(INK)
        .text("Balance due", tx + 8, cy2 + 6.5, { lineGap: 0 });
      doc.font("Sans-Bold").fontSize(9.4).fillColor(INK)
        .text(m2(balance), tx, cy2 + 6, { width: txW - 8, align: "right", lineGap: 0 });

      /* Signatures + footer */
      const sigY = Math.max(cy2 + 66, lineY + 46);
      drawSignatures(doc, d, sigY);
      drawRadheFooter(
        doc,
        "Radhe Radhe \u2013 thank you for staying with us!",
        "This is a computer-generated invoice.",
        Math.min(sigY + 42, PH - FRAME - 48)
      );

      doc.end();
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

/* ═══════════════════════════ VOUCHER ═══════════════════════════ */

export function buildVoucherPdf(d: DocData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = newDoc(d, "voucher");
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const statusText =
        d.booking.status === "CONFIRMED" ? "CONFIRMED"
        : d.booking.status === "PENDING" ? "PENDING"
        : d.booking.status === "CHECKED_IN" ? "CHECKED-IN"
        : d.booking.status === "CHECKED_OUT" ? "CHECKED-OUT"
        : d.booking.status.replace(/_/g, " ").toUpperCase();

      let y = drawPage(doc);
      y = drawHeader(doc, d, y, {
        title: "BOOKING VOUCHER",
        subLine: `Voucher No. ${d.booking.referenceCode}  \u00B7  Date ${fmtShort(new Date())}`,
        badge: statusText,
        addressSingleLine: true,
      });

      const paid = paidAmountOf(d.booking);
      const balance = Math.max(d.booking.totalAmount - paid, 0);

      /* Guest band */
      doc.rect(L, y, CW, 44).fill(SAGE);
      goldLabel(doc, "GUEST NAME", L + 12, y + 8, 5.9);
      doc.font("Serif-Bold").fontSize(14.5).fillColor(GREEN_DEEP)
        .text(d.booking.guestName, L + 12, y + 19, { width: 190, lineGap: 0, ellipsis: true });
      vline(doc, L + 214, y, y + 44);
      goldLabel(doc, "CONTACT", L + 226, y + 8, 5.9);
      doc.font("Sans").fontSize(9).fillColor(INK)
        .text(d.booking.guestPhone, L + 226, y + 19, { width: 120, lineGap: 0 });
      vline(doc, L + 356, y, y + 44);
      goldLabel(doc, "BOOKING ID", L + 368, y + 8, 5.9);
      doc.font("Sans-Bold").fontSize(9).fillColor(INK)
        .text(d.booking.referenceCode, L + 368, y + 19, { width: R - L - 368 - 8, lineGap: 0 });

      /* Check-in / nights / check-out hero row */
      let hy = y + 44 + 14;
      const heroH = 60;
      doc.rect(L, hy, CW, heroH).lineWidth(0.8).strokeColor(LINE).stroke();
      vline(doc, L + 186, hy, hy + heroH);
      vline(doc, R - 186, hy, hy + heroH);
      goldLabel(doc, "CHECK-IN", L + 14, hy + 9, 5.9);
      doc.font("Serif-Bold").fontSize(15.5).fillColor(INK)
        .text(fmtShort(new Date(d.booking.checkIn)), L + 14, hy + 20, { lineGap: 0 });
      doc.font("Sans").fontSize(7.4).fillColor(GRAY)
        .text("From 12:00 PM", L + 14, hy + 43, { lineGap: 0 });
      // center nights circle
      const ncx = PW / 2, ncy = hy + 24;
      doc.circle(ncx, ncy, 14.5).fill(GREEN);
      doc.font("Sans-Bold").fontSize(12).fillColor(WHITE)
        .text(String(d.booking.nights || 1), ncx - 15, ncy - 6.5, { width: 30, align: "center", lineGap: 0 });
      doc.font("Sans").fontSize(6.6).fillColor(GRAY)
        .text("Night(s)", ncx - 30, ncy + 20, { width: 60, align: "center", lineGap: 0 });
      goldLabel(doc, "CHECK-OUT", R - 14 - 60, hy + 9, 5.9);
      doc.font("Serif-Bold").fontSize(15.5).fillColor(INK)
        .text(fmtShort(new Date(d.booking.checkOut)), R - 14 - 150, hy + 20, { width: 150, align: "right", lineGap: 0 });
      doc.font("Sans").fontSize(7.4).fillColor(GRAY)
        .text("Till 11:00 AM", R - 14 - 150, hy + 43, { width: 150, align: "right", lineGap: 0 });

      /* 4×2 details grid */
      let gy = hy + heroH + 12;
      const colW = CW / 4;
      const rowH = 30;
      const gridCells: [string, string][] = [
        ["ROOM TYPE", d.roomName],
        ["NO. OF ROOMS", "1"],
        ["GUESTS", `${d.booking.adults} Adults, ${d.booking.children} Child`],
        ["MEAL PLAN", d.booking.planName || "Room Only"],
        ["BOOKED VIA", "Direct \u2014 Website"],
        ["ARRIVAL TIME", "Approx. 2:00 PM"],
        ["BED PREFERENCE", d.bedType || "Double"],
        ["ID REQUIRED", "Aadhaar / Passport"],
      ];
      for (let i = 0; i < gridCells.length; i++) {
        const col = i % 4, row = Math.floor(i / 4);
        const cellX = L + col * colW;
        const cellY = gy + row * rowH;
        // borders: outer box + grid lines
        doc.rect(cellX, cellY, colW, rowH).lineWidth(0.6).strokeColor(LINE).stroke();
        goldLabel(doc, gridCells[i][0], cellX + 8, cellY + 6, 5.4);
        doc.font("Sans").fontSize(8).fillColor(INK)
          .text(gridCells[i][1], cellX + 8, cellY + 17, { width: colW - 14, lineGap: 0, ellipsis: true });
      }
      gy += rowH * 2;

      /* Dark green money band */
      let my = gy + 14;
      doc.rect(L, my, CW, 46).fill(GREEN);
      const moneyCells: [string, string][] = [
        ["TOTAL TARIFF (INCL. GST)", m0(d.booking.totalAmount)],
        ["ADVANCE RECEIVED", m0(paid)],
        ["BALANCE AT HOTEL", m0(balance)],
      ];
      const mcw = CW / 3;
      moneyCells.forEach(([label, value], i) => {
        const mx = L + i * mcw;
        if (i > 0) vline(doc, mx, my + 8, my + 38, "#3A6E58", 0.7);
        doc.font("Sans-Bold").fontSize(5.9).fillColor("#CFE0D3")
          .text(label, mx + 14, my + 10, { characterSpacing: 1.2, lineGap: 0 });
        doc.font("Serif-Bold").fontSize(14).fillColor(WHITE)
          .text(value, mx + 14, my + 21, { lineGap: 0 });
      });

      /* Inclusions + special requests */
      let iy = my + 46 + 16;
      goldLabel(doc, "INCLUSIONS", L, iy);
      goldLabel(doc, "SPECIAL REQUESTS", L + 262, iy);
      const plan = (d.booking.planName || "").toUpperCase();
      const inclusions: string[] = [];
      if (plan.includes("CP") || plan.includes("BREAKFAST")) inclusions.push("Complimentary breakfast");
      inclusions.push("Free Wi-Fi and parking");
      inclusions.push("Housekeeping and 24\u00D77 reception");
      let bly = iy + 14;
      doc.font("Sans").fontSize(8.2).fillColor("#4A473E");
      for (const inc of inclusions) {
        doc.circle(L + 4.5, bly + 4, 1.4).fill(GOLD);
        doc.text(inc, L + 13, bly, { lineGap: 0 });
        bly += 13.5;
      }
      doc.font("Sans").fontSize(8.2).fillColor("#4A473E")
        .text(d.booking.specialRequests?.trim() || "None noted", L + 262, iy + 14, { width: R - L - 262 - 6, lineGap: 0 });

      /* Important terms */
      let ity = Math.max(bly + 10, iy + 60);
      goldLabel(doc, "IMPORTANT TERMS", L, ity);
      doc.font("Sans").fontSize(7.6).fillColor("#57544B");
      const vterms = [
        "1.  Please carry a valid photo ID for every guest; it is mandatory at check-in.",
        "2.  Check-in 12:00 PM and check-out 11:00 AM; early or late subject to availability.",
        "3.  Advance is non-refundable if cancelled within 48 hours of arrival.",
        "4.  Please present this voucher (printed or on phone) at reception.",
      ];
      let vty = ity + 13;
      for (const t of vterms) {
        doc.text(t, L, vty, { lineGap: 0 });
        vty += 11.5;
      }

      /* Signatures */
      const sigY = Math.max(vty + 14, iy + 118);
      drawSignatures(doc, d, sigY);

      /* Cut line + reception copy */
      let cutY = sigY + 30;
      doc.save().dash(2.5, { space: 3 }).moveTo(FRAME + 6, cutY).lineTo(PW - FRAME - 6, cutY)
        .lineWidth(0.7).strokeColor(GOLD).stroke().restore();
      try {
        doc.font("ZapfDingbats").fontSize(9).fillColor(GOLD)
          .text(String.fromCharCode(0x22), FRAME + 10, cutY - 7, { lineGap: 0 });
      } catch { /* scissors glyph optional */ }
      cutY += 12;
      doc.font("Sans").fontSize(7).fillColor(GRAY)
        .text(`Reception copy  \u00B7  Voucher ${d.booking.referenceCode}  \u00B7  Guest ${d.booking.guestName}`, L, cutY, { lineGap: 0 });
      doc.text("Guest sign: ____________", L + 262, cutY, { width: R - L - 262, align: "right", lineGap: 0 });

      drawRadheFooter(
        doc,
        "Radhe Radhe \u2013 we look forward to welcoming you!",
        "This is a computer-generated voucher.",
        Math.min(cutY + 24, PH - FRAME - 48)
      );

      doc.end();
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
