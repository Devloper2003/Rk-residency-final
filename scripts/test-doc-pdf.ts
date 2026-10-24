/**
 * Local test harness for src/lib/doc-pdf.ts (NOT part of the Next build).
 * Run:  cd /home/z/my-project/site && bun scripts/test-doc-pdf.ts
 * Writes sample invoice + voucher PDFs to /home/z/my-project/assets-tmp/.
 */
import { buildInvoicePdf, buildVoucherPdf, type DocData } from "@/lib/doc-pdf";
import { writeFileSync } from "fs";

const dummy: DocData = {
  booking: {
    referenceCode: "RK-VRD-2026-6495",
    checkIn: new Date("2026-11-02T06:30:00Z"),
    checkOut: new Date("2026-11-03T06:30:00Z"),
    nights: 1,
    adults: 2,
    children: 0,
    guestName: "Rahul Sharma",
    guestEmail: "rahul.sharma@example.com",
    guestPhone: "+91 98220 12345",
    specialRequests: "Early check-in if possible, temple darshan guidance",
    planName: "CP — Breakfast Plan",
    pricePerNight: 3000,
    subtotal: 3000,
    taxesGst: 150,
    serviceFee: 0,
    totalAmount: 3150,
    status: "CONFIRMED",
    paymentStatus: "PARTIAL",
    paymentMethod: "PARTIAL_PAID",
    paidAmount: 630,
  },
  roomName: "Deluxe Room",
  bedType: "Double",
  cfg: {
    brand_name: "RK Residency",
    phone_primary: "+91 9760814931",
    email_primary: "rkresiddency121@gmail.com",
    address_full: "Near Banke Bihari Temple, Vrindavan, Mathura, Uttar Pradesh – 281121",
    gstin: "09GUJPS8343M1ZK",
    bank_upi_id: "8954289824m@pnb",
  },
};

const inv = await buildInvoicePdf(dummy);
writeFileSync("/home/z/my-project/assets-tmp/test-invoice.pdf", inv);
console.log("invoice:", inv.length, "bytes");

const vou = await buildVoucherPdf(dummy);
writeFileSync("/home/z/my-project/assets-tmp/test-voucher.pdf", vou);
console.log("voucher:", vou.length, "bytes");
