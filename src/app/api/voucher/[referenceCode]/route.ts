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

    /* Fetch coupon */
    const coupon = await db.discountCode.findFirst({
      where: { createdByBooking: booking.id },
    });

    /* Build PDF */
    return new Promise<Response>((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4" });
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        resolve(new Response(Buffer.concat(chunks), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="RK_Residency_Voucher_${booking.referenceCode}.pdf"`,
          },
        }));
      });

      drawHeader(doc);
      let y = 115;

      /* Title */
      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.dark)
        .text("BOOKING VOUCHER", 0, y, { align: "center", width: PW });

      /* Reference code box */
      y += 40;
      const boxW = 230, boxH = 50, boxX = (PW - boxW) / 2;
      doc.roundedRect(boxX, y, boxW, boxH, 8)
        .strokeColor(C.teal).lineWidth(2).stroke();
      const refLabel = "Reference Number";
      doc.font("Helvetica").fontSize(8).fillColor(C.gray)
        .text(refLabel, 0, y + 8, { align: "center", width: PW });
      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.teal)
        .text(booking.referenceCode, 0, y + 20, { align: "center", width: PW });

      /* Booking details */
      y += 70;
      hline(doc, y);
      y += 22;

      const rows: [string, string][] = [
        ["Guest", booking.guestName],
        ["Email", booking.guestEmail],
        ["Phone", booking.guestPhone],
        ["Room", booking.room.name],
        ["Check-in", fmtDate(new Date(booking.checkIn))],
        ["Check-out", fmtDate(new Date(booking.checkOut))],
        ["Guests", `${booking.adults} Adults${booking.children > 0 ? `, ${booking.children} Children` : ""}`],
        ["Nights", String(booking.nights || 1)],
      ];
      for (const [label, value] of rows) {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.gray).text(label, MX, y, { width: 100 });
        doc.font("Helvetica").fontSize(10).fillColor(C.dark).text(value, 160, y, { width: PW - 160 - MX });
        y += 18;
      }

      /* Amount */
      y += 6;
      hline(doc, y);
      y += 22;
      doc.font("Helvetica-Bold").fontSize(12).fillColor(C.dark).text("Total Amount", MX, y);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(C.teal)
        .text(rs(booking.totalAmount), 200, y - 2);
      y += 20;
      doc.font("Helvetica-Bold").fontSize(10)
        .fillColor(booking.paymentStatus === "PAID" ? C.green : C.gold)
        .text(booking.paymentStatus, 200, y);

      /* Coupon card */
      if (coupon && coupon.isActive) {
        y += 40;
        hline(doc, y);
        y += 18;
        doc.font("Helvetica-Bold").fontSize(11).fillColor(C.gold)
          .text("Your Exclusive 5% Discount Coupon", MX, y);

        y += 28;
        const cpW = 260, cpH = 55, cpX = (PW - cpW) / 2;
        doc.roundedRect(cpX, y, cpW, cpH, 8)
          .fillAndStroke(C.lightGold, C.gold);
        doc.font("Helvetica-Bold").fontSize(20).fillColor(C.teal)
          .text(coupon.code, 0, y + 10, { align: "center", width: PW });
        doc.font("Helvetica").fontSize(7.5).fillColor(C.gray)
          .text("Valid for 90 days  \u00B7  One-time use  \u00B7  Non-transferable", 0, y + 36, { align: "center", width: PW });
      }

      /* Terms */
      y += 70;
      doc.font("Helvetica").fontSize(9).fillColor(C.gray)
        .text("Present this voucher at check-in.", MX, y);
      y += 14;
      doc.text("This voucher is non-transferable and valid only for the booked dates.", MX, y);

      /* Thank you */
      y += 30;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.teal)
        .text("We look forward to welcoming you!", MX, y);
      y += 16;
      doc.font("Helvetica").fontSize(10).fillColor(C.gray)
        .text("Atithi Devo Bhava.", MX, y);

      drawFooter(doc);
      doc.end();
    });
  } catch (e) {
    console.error("[voucher] Error:", e);
    return NextResponse.json({ error: "Failed to generate voucher" }, { status: 500 });
  }
}
