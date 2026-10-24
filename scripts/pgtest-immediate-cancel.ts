/**
 * E2E test — IMMEDIATE auto-cancel + late-payment reactivation (local PG 55432).
 * Requires: dev server on :3000, DATABASE_URL env, schema pushed.
 * Run: DATABASE_URL="postgresql://postgres:localtest@127.0.0.1:55432/rktest" bun scripts/pgtest-immediate-cancel.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "http://127.0.0.1:3000";
let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ PASS ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function ensureRoom(): Promise<string> {
  let room = await db.room.findUnique({ where: { slug: "test-deluxe" } });
  if (!room) {
    room = await db.room.create({
      data: {
        name: "Test Deluxe",
        slug: "test-deluxe",
        tagline: "Test stay",
        description: "test room",
        longDescription: "test room long",
        basePrice: 1500,
        maxGuests: 3,
        sizeSqft: 200,
        bedType: "Queen",
        view: "Garden",
        imageUrls: "[]",
        amenities: "[]",
        totalCount: 2,
        featured: false,
      },
    });
    console.log("  (created test room)");
  }
  return room.id;
}

async function createBooking(roomId: string, paymentMethod: string, fromOffsetDays: number, tag: string) {
  const from = new Date(Date.now() + fromOffsetDays * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 86_400_000);
  const res = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId,
      checkIn: from.toISOString(),
      checkOut: to.toISOString(),
      nights: 1,
      adults: 1,
      children: 0,
      guestName: `TEST Immediate ${tag}`,
      guestEmail: `immediate-${tag.toLowerCase()}@example.com`,
      guestPhone: "9999999999",
      paymentMethod,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`booking create failed: ${JSON.stringify(j)}`);
  return j as { bookingId: string; referenceCode: string; totalAmount: number };
}

async function cleanupTestBookings() {
  const rows = await db.booking.findMany({
    where: {
      OR: [
        { guestEmail: { startsWith: "immediate-" } },
        { guestName: { startsWith: "TEST Immediate" } },
      ],
    },
    select: { id: true },
  });
  const ids = rows.map((r) => r.id);
  if (!ids.length) return 0;
  await db.discountCode.deleteMany({ where: { createdByBooking: { in: ids } } });
  await db.discountCode.updateMany({ where: { usedByBooking: { in: ids } }, data: { usedByBooking: null } });
  const gone = await db.booking.deleteMany({ where: { id: { in: ids } } });
  return gone.count;
}

async function main() {
  console.log("— Immediate auto-cancel e2e —");
  // remove leftovers from any earlier crashed run so availability is clean
  const gone = await cleanupTestBookings();
  if (gone) console.log(`  (cleaned ${gone} leftover test bookings)`);
  const roomId = await ensureRoom();

  // 1. PARTIAL_PAID booking → abandon → instantly CANCELLED
  const a = await createBooking(roomId, "PARTIAL_PAID", 40, "A");
  console.log(`  booking A: ${a.referenceCode} (₹${a.totalAmount})`);
  const ab1 = await (await fetch(`${BASE}/api/bookings/abandon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: a.bookingId }),
  })).json();
  check("abandon unpaid PARTIAL_PAID → cancelled:true", ab1?.cancelled === true, JSON.stringify(ab1));
  const aDb = await db.booking.findUnique({ where: { id: a.bookingId } });
  check("booking A DB state CANCELLED", aDb?.status === "CANCELLED", aDb?.status || "missing");
  check("booking A paymentStatus FAILED", aDb?.paymentStatus === "FAILED", aDb?.paymentStatus || "");

  // 2. PAY_AT_HOTEL booking → abandon → NO-OP (stays CONFIRMED)
  const b = await createBooking(roomId, "PAY_AT_HOTEL", 41, "B");
  console.log(`  booking B: ${b.referenceCode} (₹${b.totalAmount})`);
  const ab2 = await (await fetch(`${BASE}/api/bookings/abandon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: b.bookingId }),
  })).json();
  check("abandon PAY_AT_HOTEL → no-op", ab2?.cancelled === false, JSON.stringify(ab2));
  const bDb = await db.booking.findUnique({ where: { id: b.bookingId } });
  check("booking B still CONFIRMED", bDb?.status === "CONFIRMED", bDb?.status || "missing");

  // 3. Late payment on cancelled booking, slot FREE → auto re-activate
  //    (fresh PARTIAL_PAID booking, cancel it via abandon, then simulate capture)
  const c = await createBooking(roomId, "PARTIAL_PAID", 42, "C");
  await fetch(`${BASE}/api/bookings/abandon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: c.bookingId }),
  });
  const { applyCapturedPayment } = await import("@/lib/booking-sync");
  const revived = await applyCapturedPayment(c.bookingId, "pay_test_reactivate_1");
  check("applyCapturedPayment on cancelled+free slot → true", revived === true, String(revived));
  const cDb = await db.booking.findUnique({ where: { id: c.bookingId } });
  check("booking C re-activated CONFIRMED", cDb?.status === "CONFIRMED", cDb?.status || "");
  const expected20 = Math.round(c.totalAmount * 0.2);
  check("booking C paidAmount = 20% advance", cDb?.paidAmount === expected20, `${cDb?.paidAmount} vs ${expected20}`);
  check("booking C paymentStatus PARTIAL", cDb?.paymentStatus === "PARTIAL", cDb?.paymentStatus || "");
  check("booking C paymentRef stored", cDb?.paymentRef === "pay_test_reactivate_1", cDb?.paymentRef || "");

  // 4. Late payment on cancelled booking, slot TAKEN → stays cancelled (refund alert)
  //    Book E on the dates D would occupy via DB (API rate-limit: 3/min), cancel D, then capture.
  const from43 = new Date(Date.now() + 43 * 86_400_000);
  from43.setUTCHours(0, 0, 0, 0);
  const anyGuest = (await db.guest.findFirst())!;
  const e = await db.booking.create({
    data: {
      referenceCode: `RK-VRD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId,
      guestId: anyGuest.id,
      checkIn: from43,
      checkOut: new Date(from43.getTime() + 86_400_000),
      nights: 1,
      guestName: "TEST Immediate E",
      guestEmail: anyGuest.email,
      guestPhone: "9999999999",
      pricePerNight: 1500,
      subtotal: 1500,
      taxesGst: 75,
      serviceFee: 0,
      totalAmount: 1575,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentMethod: "PAY_AT_HOTEL",
      paidAmount: 0,
    },
  });
  const d = await db.booking.create({
    data: {
      referenceCode: `RK-VRD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId,
      guestId: (await db.guest.findFirst())!.id,
      checkIn: from43,
      checkOut: new Date(from43.getTime() + 86_400_000),
      nights: 1,
      guestName: "TEST Immediate D",
      guestEmail: "immediate-d@example.com",
      guestPhone: "9999999999",
      pricePerNight: 1500,
      subtotal: 1500,
      taxesGst: 75,
      serviceFee: 0,
      totalAmount: 1575,
      status: "CANCELLED",
      paymentStatus: "FAILED",
      paymentMethod: "PARTIAL_PAID",
      paidAmount: 0,
    },
  });
  const revivedClash = await applyCapturedPayment(d.id, "pay_test_reactivate_2");
  check("applyCapturedPayment on cancelled+CLASH → false", revivedClash === false, String(revivedClash));
  const dDb = await db.booking.findUnique({ where: { id: d.id } });
  check("booking D stays CANCELLED (no silent paid flag)", dDb?.status === "CANCELLED" && dDb?.paymentStatus === "FAILED", `${dDb?.status}/${dDb?.paymentStatus}`);

  // cleanup test rows so they don't pollute local data
  const cleaned = await cleanupTestBookings();
  console.log(`  (cleaned ${cleaned} test bookings)`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await db.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("E2E error:", e);
  await db.$disconnect();
  process.exit(1);
});
