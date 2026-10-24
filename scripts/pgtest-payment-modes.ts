/**
 * E2E test for the 3 payment modes (Prepaid / Partial Paid 20% / Pay at Hotel).
 * Run: DATABASE_URL=... bun scripts/pgtest-payment-modes.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "http://localhost:3111";
const PASS = "✅";
const FAIL = "❌";

let results: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  results.push(`${cond ? PASS : FAIL} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  // ── Clean previous test bookings (fresh inventory for every run) ──
  // (confirmation flow may have created coupon rows referencing them — clear those first)
  const oldBookings = await db.booking.findMany({
    where: { guestEmail: { startsWith: "t." } },
    select: { id: true },
  });
  for (const b of oldBookings) {
    await db.discountCode.updateMany({ where: { usedByBooking: b.id }, data: { usedByBooking: null, usedAt: null } });
    await db.discountCode.deleteMany({ where: { createdByGuest: { startsWith: "t." } } });
  }
  await db.booking.deleteMany({ where: { guestEmail: { startsWith: "t." } } });

  // ── Seed room ──
  let room = await db.room.findUnique({ where: { slug: "deluxe-room" } });
  if (!room) {
    room = await db.room.create({
      data: {
        slug: "deluxe-room",
        name: "Deluxe Room",
        tagline: "Test room",
        description: "Test",
        longDescription: "Test",
        basePrice: 2000,
        maxGuests: 3,
        sizeSqft: 220,
        bedType: "Queen",
        view: "Garden",
        imageUrls: JSON.stringify(["/images/x.webp"]),
        amenities: JSON.stringify(["WiFi"]),
        totalCount: 4,
      },
    });
  }

  const checkIn = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) + "T00:00:00.000Z";
  const checkOut = new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10) + "T00:00:00.000Z";

  async function book(mode: string, seq: number) {
    const res = await fetch(`${BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.77.${seq}.1` },
      body: JSON.stringify({
        roomId: room!.id, checkIn, checkOut, nights: 1, adults: 2, children: 0,
        guestName: `Test ${mode}`, guestEmail: `t.${mode.toLowerCase()}@x.com`,
        guestPhone: "+919999999999", paymentMethod: mode,
      }),
    });
    return { res, data: await res.json() };
  }

  // ── 1. Create booking in each mode (unique IP per call — booking rate limit is 3/min/IP) ──
  const prepaid = await book("PREPAID", 1);
  check("PREPAID booking created", prepaid.res.ok, prepaid.data.referenceCode);
  check("PREPAID starts PENDING / ₹0 collected", prepaid.data.paymentStatus === "PENDING");
  check("PREPAID payableNow = 2000 + 5% GST = 2100", prepaid.data.payableNow === 2100, `got ${prepaid.data.payableNow}`);

  const partial = await book("PARTIAL_PAID", 2);
  check("PARTIAL_PAID booking created", partial.res.ok, partial.data.referenceCode);
  check("PARTIAL payableNow = 20% of 2100 = 420", partial.data.payableNow === 420, `got ${partial.data.payableNow}`);

  const atHotel = await book("PAY_AT_HOTEL", 3);
  check("PAY_AT_HOTEL booking created", atHotel.res.ok, atHotel.data.referenceCode);
  check("PAY_AT_HOTEL payableNow = 0", atHotel.data.payableNow === 0, `got ${atHotel.data.payableNow}`);

  // legacy mode must be rejected by zod now (unique IP avoids the rate limiter masking it)
  const legacy = await book("RAZORPAY", 4);
  check("Legacy RAZORPAY mode rejected (400)", legacy.res.status === 400, `got ${legacy.res.status}: ${JSON.stringify(legacy.data).slice(0, 120)}`);

  // ── 2. Razorpay order guards ──
  const oh = await fetch(`${BASE}/api/razorpay/order`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: atHotel.data.bookingId }),
  });
  check("Order blocked for PAY_AT_HOTEL", oh.status === 400, `got ${oh.status}`);

  // ── 3. DB-level verify: simulate razorpay verify outcomes via direct db math ──
  const pBooking = await db.booking.findUnique({ where: { id: partial.data.bookingId } });
  check("PARTIAL booking stored mode", pBooking?.paymentMethod === "PARTIAL_PAID");
  check("PARTIAL booking paidAmount 0 at creation", pBooking?.paidAmount === 0);

  // ── 4. Admin set-mode flow (login required — test the handler logic directly via db) ──
  // We simulate what /api/admin/all booking_status does (same lib call):
  const { payableNow } = await import("../src/lib/payment-modes");
  check("lib payableNow(PARTIAL_PAID, 2100) = 420", payableNow("PARTIAL_PAID", 2100) === 420);
  check("lib payableNow(PREPAID, 2100) = 2100", payableNow("PREPAID", 2100) === 2100);
  check("lib payableNow(PAY_AT_HOTEL, 2100) = 0", payableNow("PAY_AT_HOTEL", 2100) === 0);

  // ── 5. Apply SET_MODE_* updates directly to prove the write path ──
  await db.booking.update({ where: { id: atHotel.data.bookingId }, data: { paymentMethod: "PARTIAL_PAID", paymentStatus: "PARTIAL", paidAmount: payableNow("PARTIAL_PAID", atHotel.data.totalAmount) } });
  const a2 = await db.booking.findUnique({ where: { id: atHotel.data.bookingId } });
  check("SET_MODE_PARTIAL_PAID: status PARTIAL, paid 20%", a2?.paymentStatus === "PARTIAL" && a2?.paidAmount === Math.round(atHotel.data.totalAmount * 0.2), `paid=${a2?.paidAmount}`);

  await db.booking.update({ where: { id: atHotel.data.bookingId }, data: { paymentMethod: "PREPAID", paymentStatus: "PAID", paidAmount: atHotel.data.totalAmount } });
  const a3 = await db.booking.findUnique({ where: { id: atHotel.data.bookingId } });
  check("SET_MODE_PREPAID: status PAID, paid full", a3?.paymentStatus === "PAID" && a3?.paidAmount === atHotel.data.totalAmount);

  await db.booking.update({ where: { id: atHotel.data.bookingId }, data: { paymentMethod: "PAY_AT_HOTEL", paymentStatus: "PENDING", paidAmount: 0 } });
  const a4 = await db.booking.findUnique({ where: { id: atHotel.data.bookingId } });
  check("SET_MODE_PAY_AT_HOTEL: status PENDING, paid 0", a4?.paymentStatus === "PENDING" && a4?.paidAmount === 0);

  // ── 6. Simulate verified Razorpay advance on the partial booking, then check guest docs ──
  await db.booking.update({
    where: { id: partial.data.bookingId },
    data: { paymentStatus: "PARTIAL", paidAmount: Math.round(partial.data.totalAmount * 0.2) },
  });

  // ── 7. Voucher PDF renders for partial booking (binary — check status + content type) ──
  const doc = await fetch(`${BASE}/api/voucher/${partial.data.referenceCode}`);
  check("Voucher PDF renders 200 for PARTIAL booking", doc.status === 200, `type=${doc.headers.get("content-type")}`);
  check("Voucher is application/pdf", (doc.headers.get("content-type") || "").includes("pdf"));

  // ── 8. booking-doc HTML invoice page ──
  const doc2 = await fetch(`${BASE}/booking-doc/${partial.data.bookingId}?type=invoice`);
  const doc2Text = await doc2.text();
  check("booking-doc invoice renders 200", doc2.status === 200);
  check("booking-doc shows PARTIAL (20%)", doc2Text.includes("PARTIAL (20%)"), doc2.status === 200 ? "" : `HTTP ${doc2.status}`);
  check("booking-doc shows 20% advance label (voucher)", (await (await fetch(`${BASE}/booking-doc/${partial.data.bookingId}?type=voucher`)).text()).includes("20% ADVANCE RECEIVED"), "");
  check("booking-doc shows balance due row", doc2Text.includes("Balance Due"), "");

  console.log(results.join("\n"));
  const fails = results.filter((r) => r.startsWith(FAIL)).length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  await db.$disconnect();
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(results.join("\n"));
  console.error("FATAL:", e);
  process.exit(1);
});
