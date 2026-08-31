import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { c, PW, PH, MX, drawHeader, drawFooter, hline, fmtDate, rs } from "@/lib/pdf-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ referenceCode: string }> }) {
  try {
    const { referenceCode } = await params;

    const booking = await db.booking.findUnique({
      where: { referenceCode },
      include: { room: { select: { name: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    /* ── Fetch bank settings ── */
    const bankRows = await db.siteSetting.findMany({
      where: { key: { in: ["bank_account_name", "bank_account_number", "bank_ifsc", "bank_upi_id"] } },
      select: { key: true, value: true },
    });
    const bank: Record<string, string> = {};
    bankRows.forEach((s) => { bank[s.key] = s.value; });

    /* ── Build PDF ── */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PW, PH]);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = PH - 90;

    /* Header */
    drawHeader(page, bold, reg);

    /* Title */
    y -= 30;
    page.drawText("INVOICE", { x: MX, y, size: 22, font: bold, color: c.dark });

    /* Right-side: date & ref */
    const dateStr = fmtDate(new Date());
    page.drawText(`Date: ${dateStr}`, {
      x: PW - MX - reg.widthOfTextAtSize(`Date: ${dateStr}`, 9), y: y + 4, size: 9, font: reg, color: c.gray,
    });
    page.drawText(`Ref: ${booking.referenceCode}`, {
      x: PW - MX - reg.widthOfTextAtSize(`Ref: ${booking.referenceCode}`, 9), y: y - 10, size: 9, font: reg, color: c.gray,
    });

    /* Bill To */
    y -= 40;
    page.drawText("Bill To:", { x: MX, y, size: 10, font: bold, color: c.gray });
    y -= 16;
    page.drawText(booking.guestName, { x: MX, y, size: 13, font: bold, color: c.dark });
    y -= 15;
    page.drawText(booking.guestEmail, { x: MX, y, size: 10, font: reg, color: c.dark });
    y -= 14;
    page.drawText(booking.guestPhone, { x: MX, y, size: 10, font: reg, color: c.dark });

    /* Separator */
    y -= 20;
    hline(page, y);

    /* Table header */
    y -= 20;
    page.drawText("Description", { x: MX, y, size: 9, font: bold, color: c.gray });
    page.drawText("Nights", { x: 330, y, size: 9, font: bold, color: c.gray });
    page.drawText("Rate/Night", { x: 400, y, size: 9, font: bold, color: c.gray });
    page.drawText("Amount", { x: 480, y, size: 9, font: bold, color: c.gray });
    y -= 5;
    hline(page, y);

    /* Table row */
    y -= 18;
    const nights = booking.nights || 1;
    const subtotal = booking.subtotal || booking.totalAmount;
    const ratePerNight = Math.round(subtotal / nights);

    page.drawText(booking.room.name, { x: MX, y, size: 10, font: reg, color: c.dark });
    page.drawText(String(nights), { x: 345, y, size: 10, font: reg, color: c.dark });
    page.drawText(rs(ratePerNight), { x: 400, y, size: 10, font: reg, color: c.dark });
    page.drawText(rs(subtotal), { x: 480, y, size: 10, font: reg, color: c.dark });
    y -= 5;
    hline(page, y);

    /* Totals */
    y -= 22;
    const gstAmount = booking.totalAmount - subtotal;

    page.drawText("Subtotal", { x: 380, y, size: 10, font: reg, color: c.gray });
    page.drawText(rs(subtotal), { x: 480, y, size: 10, font: reg, color: c.dark });
    y -= 18;
    page.drawText("GST (18%)", { x: 380, y, size: 10, font: reg, color: c.gray });
    page.drawText(rs(gstAmount), { x: 480, y, size: 10, font: reg, color: c.dark });
    y -= 5;
    hline(page, y);
    y -= 22;
    page.drawText("TOTAL", { x: 380, y, size: 13, font: bold, color: c.dark });
    page.drawText(rs(booking.totalAmount), { x: 480, y, size: 13, font: bold, color: c.teal });

    /* Payment */
    y -= 30;
    page.drawText(`Payment: ${booking.paymentStatus}`, { x: MX, y, size: 10, font: bold, color: booking.paymentStatus === "PAID" ? c.green : c.gold });
    page.drawText(`Method: ${booking.paymentMethod || "N/A"}`, { x: 220, y, size: 10, font: reg, color: c.gray });

    /* Bank Details */
    y -= 35;
    hline(page, y);
    y -= 20;
    page.drawText("Bank Details (for offline payment)", { x: MX, y, size: 10, font: bold, color: c.gold });

    const bankLines = [
      bank.bank_account_name && `Account Name: ${bank.bank_account_name}`,
      bank.bank_account_number && `Account No: ${bank.bank_account_number}`,
      bank.bank_ifsc && `IFSC: ${bank.bank_ifsc}`,
      bank.bank_upi_id && `UPI: ${bank.bank_upi_id}`,
    ].filter(Boolean) as string[];

    for (const line of bankLines) { y -= 16; page.drawText(line, { x: MX + 10, y, size: 9, font: reg, color: c.dark }); }
    if (!bankLines.length) { y -= 16; page.drawText("Bank details not configured. Contact +91 9760814931.", { x: MX + 10, y, size: 9, font: reg, color: c.gray }); }

    /* Thank you */
    y -= 35;
    page.drawText("Thank you for choosing RK Residency!", { x: MX, y, size: 11, font: bold, color: c.teal });
    y -= 16;
    page.drawText("Atithi Devo Bhava.", { x: MX, y, size: 10, font: reg, color: c.gray });

    drawFooter(page, reg);

    const bytes = await pdfDoc.save();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="RK_Residency_Invoice_${booking.referenceCode}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[invoice] Error:", e);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
