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

    /* Fetch coupon for this booking */
    const coupon = await db.discountCode.findFirst({
      where: { createdByBooking: booking.id },
    });

    /* ── Build PDF ── */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PW, PH]);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = PH - 90;
    drawHeader(page, bold, reg);

    /* Title */
    y -= 35;
    const title = "BOOKING VOUCHER";
    page.drawText(title, { x: (PW - bold.widthOfTextAtSize(title, 22)) / 2, y, size: 22, font: bold, color: c.dark });

    /* Reference code box */
    y -= 50;
    const boxW = 230, boxH = 48;
    const boxX = (PW - boxW) / 2;
    page.drawRoundedRectangle({ x: boxX, y: y - boxH + 18, width: boxW, height: boxH, radius: 8, borderColor: c.teal, borderWidth: 2 });
    page.drawText(booking.referenceCode, {
      x: (PW - bold.widthOfTextAtSize(booking.referenceCode, 24)) / 2, y: y - 8, size: 24, font: bold, color: c.teal,
    });
    const refLabel = "Reference Number";
    page.drawText(refLabel, {
      x: (PW - reg.widthOfTextAtSize(refLabel, 8)) / 2, y: y - 26, size: 8, font: reg, color: c.gray,
    });

    /* Booking details */
    y -= 65;
    hline(page, y);
    y -= 25;

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
      page.drawText(label, { x: MX, y, size: 10, font: bold, color: c.gray });
      page.drawText(value, { x: 160, y, size: 10, font: reg, color: c.dark });
      y -= 18;
    }

    /* Amount */
    y -= 5;
    hline(page, y);
    y -= 25;
    page.drawText("Total Amount", { x: MX, y, size: 12, font: bold, color: c.dark });
    page.drawText(rs(booking.totalAmount), { x: 200, y, size: 16, font: bold, color: c.teal });
    y -= 18;
    page.drawText(booking.paymentStatus, { x: 200, y, size: 10, font: bold, color: booking.paymentStatus === "PAID" ? c.green : c.gold });

    /* ── Coupon card ── */
    if (coupon && coupon.isActive) {
      y -= 40;
      hline(page, y);
      y -= 22;
      page.drawText("Your Exclusive 5% Discount Coupon", { x: MX, y, size: 11, font: bold, color: c.gold });

      y -= 28;
      const cpW = 260, cpH = 55;
      const cpX = (PW - cpW) / 2;
      /* Gold dashed border effect (solid for PDF) */
      page.drawRoundedRectangle({ x: cpX, y: y - cpH + 18, width: cpW, height: cpH, radius: 8, borderColor: c.gold, borderWidth: 2, color: c.lightGoldBg });

      page.drawText(coupon.code, {
        x: (PW - bold.widthOfTextAtSize(coupon.code, 20)) / 2, y: y - 4, size: 20, font: bold, color: c.teal,
      });
      const cpInfo = "Valid for 90 days  \u00B7  One-time use  \u00B7  Non-transferable";
      page.drawText(cpInfo, {
        x: (PW - reg.widthOfTextAtSize(cpInfo, 7.5)) / 2, y: y - 22, size: 7.5, font: reg, color: c.gray,
      });
    }

    /* Terms */
    y -= 60;
    page.drawText("Present this voucher at check-in.", { x: MX, y, size: 9, font: reg, color: c.gray });
    y -= 14;
    page.drawText("This voucher is non-transferable and valid only for the booked dates.", { x: MX, y, size: 9, font: reg, color: c.gray });

    /* Thank you */
    y -= 30;
    page.drawText("We look forward to welcoming you!", { x: MX, y, size: 11, font: bold, color: c.teal });
    y -= 14;
    page.drawText("Atithi Devo Bhava.", { x: MX, y, size: 10, font: reg, color: c.gray });

    drawFooter(page, reg);

    const bytes = await pdfDoc.save();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="RK_Residency_Voucher_${booking.referenceCode}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[voucher] Error:", e);
    return NextResponse.json({ error: "Failed to generate voucher" }, { status: 500 });
  }
}
