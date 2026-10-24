import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildVoucherPdf, buildDocCfg, DOC_SETTING_KEYS } from "@/lib/doc-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/voucher/[referenceCode]
 * Owner-approved voucher design (cream/gold/deep-green, cut-line reception copy)
 * — shared with the admin panel download and the guest email links, so everyone
 * sees the SAME document. Rendered live from the booking row.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ referenceCode: string }> }) {
  try {
    const { referenceCode } = await params;

    const booking = await db.booking.findUnique({
      where: { referenceCode },
      include: { room: { select: { name: true, bedType: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Guest-token gate (same as invoice route) — blocks reference-code
    // enumeration; the confirmation email's links carry the token.
    const token = new URL(req.url).searchParams.get("token") || "";
    if (booking.downloadToken && booking.downloadToken !== token) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const settings = await db.siteSetting.findMany({
      where: { key: { in: DOC_SETTING_KEYS } },
      select: { key: true, value: true },
    });

    const pdf = await buildVoucherPdf({
      booking,
      roomName: booking.room?.name || "Room",
      bedType: booking.room?.bedType,
      cfg: buildDocCfg(settings),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="RK_Residency_Voucher_${booking.referenceCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[voucher] Error:", e);
    return NextResponse.json({ error: "Failed to generate voucher" }, { status: 500 });
  }
}
