import { PDFDocument, rgb, Page, PDFFont } from "pdf-lib";

/* ── Brand Colors ── */
export const c = {
  teal:   rgb(14/255, 76/255, 79/255),
  gold:   rgb(212/255, 160/255, 86/255),
  dark:   rgb(35/255, 31/255, 28/255),
  gray:   rgb(107/255, 101/255, 96/255),
  border: rgb(229/255, 224/255, 216/255),
  white:  rgb(1, 1, 1),
  green:  rgb(46/255, 125/255, 50/255),
  lightGoldBg: rgb(255/255, 248/255, 225/255),
};

/* ── A4 Size ── */
export const PW = 595.28;
export const PH = 841.89;
export const MX = 50; // left/right margin

/* ── Draw teal header bar ── */
export function drawHeader(page: Page, bold: PDFFont, reg: PDFFont) {
  page.drawRectangle({ x: 0, y: PH - 90, width: PW, height: 90, color: c.teal });
  const t = "RK Residency";
  page.drawText(t, { x: (PW - bold.widthOfTextAtSize(t, 26)) / 2, y: PH - 55, size: 26, font: bold, color: c.gold });
  const s = "VRINDAVAN  \u00B7  BRAJ";
  page.drawText(s, { x: (PW - reg.widthOfTextAtSize(s, 9)) / 2, y: PH - 72, size: 9, font: reg, color: c.white, opacity: 0.6 });
}

/* ── Draw teal footer bar ── */
export function drawFooter(page: Page, font: PDFFont) {
  page.drawRectangle({ x: 0, y: 0, width: PW, height: 28, color: c.teal });
  page.drawText("RK Residency, Vrindavan  \u00B7  +91 9760814931  \u00B7  www.rkresidencyvrindavan.in", {
    x: MX, y: 9, size: 7, font, color: c.white, opacity: 0.5,
  });
}

/* ── Horizontal separator line ── */
export function hline(page: Page, y: number) {
  page.drawLine({ start: { x: MX, y }, end: { x: PW - MX, y }, thickness: 0.5, color: c.border });
}

/* ── Format helpers ── */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function rs(n: number): string {
  return "\u20B9" + n.toLocaleString("en-IN");
}
