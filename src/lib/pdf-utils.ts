import PDFDocument from "pdfkit";

/* ── A4 dimensions (points) ── */
export const PW = 595.28;
export const PH = 841.89;
export const MX = 50;

/* ── Brand Colors ── */
export const C = {
  teal: "#0E4C4F",
  gold: "#D4A056",
  dark: "#231F1C",
  gray: "#6B6560",
  border: "#E5E0D8",
  white: "#FFFFFF",
  green: "#2E7D32",
  lightGold: "#FFF8E1",
};

/* ── Draw teal header bar ── */
export function drawHeader(doc: PDFDocument) {
  doc.rect(0, 0, PW, 90).fill(C.teal);
  doc.font("Helvetica-Bold").fontSize(26).fillColor(C.gold)
    .text("RK Residency", 0, 35, { align: "center", width: PW });
  doc.font("Helvetica").fontSize(9).fillColor("#9EC6C8")
    .text("VRINDAVAN  \u00B7  BRAJ", 0, 66, { align: "center", width: PW });
}

/* ── Draw teal footer bar ── */
export function drawFooter(doc: PDFDocument) {
  doc.rect(0, PH - 28, PW, 28).fill(C.teal);
  doc.font("Helvetica").fontSize(7).fillColor("#7AAEB0")
    .text(
      "RK Residency, Vrindavan  \u00B7  +91 9760814931  \u00B7  www.rkresidencyvrindavan.in",
      MX, PH - 20, { width: PW - MX * 2 }
    );
}

/* ── Horizontal separator line ── */
export function hline(doc: PDFDocument, y: number) {
  doc.save()
    .moveTo(MX, y).lineTo(PW - MX, y)
    .strokeColor(C.border).lineWidth(0.5)
    .stroke()
    .restore();
}

/* ── Formatters ── */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
export function rs(n: number): string {
  return "\u20B9" + n.toLocaleString("en-IN");
}
