import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";
import { C, PW, PH, MX, drawHeader, drawFooter, hline, fmtDate, rs } from "@/lib/pdf-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ referenceCode: string }> }) {
  try {
    const { referenceCode } = await params;

    const booking = await db.booking.findUnique({
      where: { referenceCode },
      include: { room: { select: { name: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    /* Fetch bank settings */
    const bankRows = await db.siteSetting.findMany({
      where: { key: { in: ["bank_account_name", "bank_account_number", "bank_ifsc", "bank_upi_id"] } },
      select: { key: true, value: true },
    });
    const bank: Record<string, string> = {};
    bankRows.forEach((s) => { bank[s.key] = s.value; });

    /* Build PDF */
    return new Promise<Response>((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4" });
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        resolve(new Response(Buffer.concat(chunks), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="RK_Residency_Invoice_${booking.referenceCode}.pdf"`,
          },
        }));
      });

      drawHeader(doc);
      let y = 110;

      /* Title */
      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.dark)
        .text("INVOICE", MX, y);

      /* Right side: date & ref */
      const dateStr = fmtDate(new Date());
      doc.font("Helvetica").fontSize(9).fillColor(C.gray);
      doc.text(`Date: ${dateStr}`, 340, y + 2, { width: 205, align: "right" });
      doc.text(`Ref: ${booking.referenceCode}`, 340, y + 14, { width: 205, align: "right" });

      /* Bill To */
      y += 42;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.gray).text("Bill To:", MX, y);
      y += 16;
      doc.font("Helvetica-Bold").fontSize(13).fillColor(C.dark).text(booking.guestName, MX, y);
      y += 16;
      doc.font("Helvetica").fontSize(10).fillColor(C.dark).text(booking.guestEmail, MX, y);
      y += 15;
      doc.text(booking.guestPhone, MX, y);

      /* Separator */
      y += 22;
      hline(doc, y);

      /* Table header */
      y += 16;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.gray);
      doc.text("Description", MX, y);
      doc.text("Nights", 320, y);
      doc.text("Rate/Night", 395, y);
      doc.text("Amount", 460, y, { width: 80, align: "right" });
      y += 14;
      hline(doc, y);

      /* Table row */
      y += 10;
      const nights = booking.nights || 1;
      const subtotal = booking.subtotal || booking.totalAmount;
      const ratePerNight = Math.round(subtotal / nights);

      doc.font("Helvetica").fontSize(10).fillColor(C.dark);
      doc.text(booking.room.name, MX, y, { width: 280 });
      doc.text(String(nights), 340, y);
      doc.text(rs(ratePerNight), 395, y);
      doc.text(rs(subtotal), 460, y, { width: 80, align: "right" });
      y += 14;
      hline(doc, y);

      /* Totals */
      y += 18;
      const gstAmount = booking.totalAmount - subtotal;

      doc.font("Helvetica").fontSize(10);
      doc.fillColor(C.gray).text("Subtotal", 380, y);
      doc.fillColor(C.dark).text(rs(subtotal), 460, y, { width: 80, align: "right" });
      y += 16;
      doc.fillColor(C.gray).text("GST (18%)", 380, y);
      doc.fillColor(C.dark).text(rs(gstAmount), 460, y, { width: 80, align: "right" });
      y += 6;
      hline(doc, y);
      y += 18;
      doc.font("Helvetica-Bold").fontSize(13).fillColor(C.dark).text("TOTAL", 380, y);
      doc.fillColor(C.teal).text(rs(booking.totalAmount), 460, y, { width: 80, align: "right" });

      /* Payment status */
      y += 28;
      doc.font("Helvetica-Bold").fontSize(10)
        .fillColor(booking.paymentStatus === "PAID" ? C.green : C.gold)
        .text(`Payment: ${booking.paymentStatus}`, MX, y, { continued: true })
        .font("Helvetica").fillColor(C.gray)
        .text(`    Method: ${booking.paymentMethod || "N/A"}`);

      /* Bank Details */
      y += 32;
      hline(doc, y);
      y += 18;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.gold)
        .text("Bank Details (for offline payment)", MX, y);

      const bankLines = [
        bank.bank_account_name && `Account Name: ${bank.bank_account_name}`,
        bank.bank_account_number && `Account No: ${bank.bank_account_number}`,
        bank.bank_ifsc && `IFSC: ${bank.bank_ifsc}`,
        bank.bank_upi_id && `UPI: ${bank.bank_upi_id}`,
      ].filter(Boolean) as string[];

      for (const line of bankLines) {
        y += 16;
        doc.font("Helvetica").fontSize(9).fillColor(C.dark).text(line, MX + 10, y);
      }
      if (!bankLines.length) {
        y += 16;
        doc.font("Helvetica").fontSize(9).fillColor(C.gray)
          .text("Bank details not configured. Contact +91 9760814931.", MX + 10, y);
      }

      /* Thank you */
      y += 35;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.teal)
        .text("Thank you for choosing RK Residency!", MX, y);
      y += 16;
      doc.font("Helvetica").fontSize(10).fillColor(C.gray)
        .text("Atithi Devo Bhava.", MX, y);

      drawFooter(doc);
      doc.end();
    });
  } catch (e) {
    console.error("[invoice] Error:", e);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
