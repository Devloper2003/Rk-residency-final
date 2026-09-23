import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  roomId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).default(2),
  children: z.number().int().min(0).default(0),
  nights: z.number().int().min(1),
  pricePerNight: z.number().int().min(1),
  subtotal: z.number().int().min(0),
  taxesGst: z.number().int().min(0),
  serviceFee: z.number().int().min(0),
  totalAmount: z.number().int().min(0),
  specialRequests: z.string().optional(),
  paymentMethod: z.string().default("PAY_AT_HOTEL"),
});

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;

    let guest = await db.guest.findUnique({ where: { email: d.guestEmail.toLowerCase() } });
    if (!guest) guest = await db.guest.create({ data: { fullName: d.guestName, email: d.guestEmail.toLowerCase(), phone: d.guestPhone } });

    const room = await db.room.findUnique({ where: { id: d.roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const checkIn = new Date(d.checkIn);
    const checkOut = new Date(d.checkOut);
    const overlappingBookings = await db.booking.count({ where: { roomId: d.roomId, status: { not: "CANCELLED" }, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } } });
    if (overlappingBookings >= room.totalCount) return NextResponse.json({ error: `No availability for ${room.name} on these dates.` }, { status: 409 });

    const year = new Date().getFullYear();
    const lastBooking = await db.booking.findFirst({ where: { referenceCode: { startsWith: `RK-VRD-${year}-` } }, orderBy: { referenceCode: "desc" }, select: { referenceCode: true } });
    const lastNum = lastBooking ? parseInt(lastBooking.referenceCode.split("-").pop() || "0", 10) : 0;
    const referenceCode = `RK-VRD-${year}-${String(lastNum + 1).padStart(4, "0")}`;

    const booking = await db.booking.create({
      data: { referenceCode, roomId: d.roomId, guestId: guest.id, checkIn, checkOut, nights: d.nights, adults: d.adults, children: d.children, guestName: d.guestName, guestEmail: d.guestEmail.toLowerCase(), guestPhone: d.guestPhone, specialRequests: d.specialRequests || null, pricePerNight: d.pricePerNight, subtotal: d.subtotal, taxesGst: d.taxesGst, serviceFee: d.serviceFee, totalAmount: d.totalAmount, status: "CONFIRMED", paymentStatus: "PENDING", paymentMethod: d.paymentMethod },
    });

    await db.auditLog.create({ data: { adminId: admin.id, action: "BOOKING_CREATED_MANUAL", entity: "Booking", entityId: booking.id, details: `Manual booking ${referenceCode} for ${d.guestName} — ${room.name} x ${d.nights} nights = Rs.${d.totalAmount}` } });

    return NextResponse.json({ ok: true, booking, referenceCode });
  } catch (e) {
    console.error("[/api/admin/booking/create] error:", e);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
