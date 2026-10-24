import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { buildInvoicePdf, buildVoucherPdf, buildDocCfg, DOC_SETTING_KEYS } from "@/lib/doc-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/booking-pdf/[bookingId]?type=voucher|invoice   (admin only)
 *
 * Admin panel downloads — uses the SAME owner-approved design as the guest
 * email links (/api/invoice, /api/voucher), so what the admin downloads is
 * exactly what the guest receives.
 */
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

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { name: true, bedType: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const settings = await db.siteSetting.findMany({
      where: { key: { in: DOC_SETTING_KEYS } },
      select: { key: true, value: true },
    });
    const cfg = buildDocCfg(settings);

    const data = {
      booking,
      roomName: booking.room?.name || "Room",
      bedType: booking.room?.bedType,
      cfg,
    };

    const pdfBuffer = type === "invoice" ? await buildInvoicePdf(data) : await buildVoucherPdf(data);

    const filename = `RK-Residency-${type === "invoice" ? "Tax-Invoice" : "Booking-Voucher"}-${booking.referenceCode}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
