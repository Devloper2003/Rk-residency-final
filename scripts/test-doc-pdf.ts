/**
 * Local visual test: build voucher + invoice PDFs with the owner's logo
 * loaded through the same brandLogoPng pipeline used in production.
 * Uses the live https URL so no DB is needed locally.
 */
import { buildVoucherPdf, buildInvoicePdf } from "../src/lib/doc-pdf";
import { writeFileSync } from "fs";

const cfg: Record<string, string> = {
  brand_name: "RK Residency",
  brand_tagline: "Boutique Hotel · Vrindavan",
  phone_primary: "+91 9760814931",
  email_primary: "rkresidency121@gmail.com",
  address_full: "Near Shani Dev Mandir, Kailash Nagar, Vrindavan, Uttar Pradesh 281121",
  gstin: "09GUJPS8343M1ZK",
  bank_upi_id: "rkresidency@upi",
  logo_image_url: "https://www.rkresidencyvrindavan.in/uploads/logo-transparent.webp",
};

const booking = {
  referenceCode: "RK-TEST-1234",
  checkIn: new Date("2026-11-10"),
  checkOut: new Date("2026-11-12"),
  nights: 2,
  adults: 2,
  children: 0,
  guestName: "Test Guest",
  guestEmail: "test@example.com",
  guestPhone: "+91 9999999999",
  specialRequests: null,
  status: "CONFIRMED",
  paymentMethod: "PREPAID",
  paymentStatus: "PAID",
  planName: "CP Plan",
  pricePerNight: 2500,
  subtotal: 5000,
  taxesGst: 250,
  totalAmount: 5250,
  amountPaid: 5250,
} as any;

const base = "/home/z/my-project/tmp-assets";

const voucher = await buildVoucherPdf({ booking, roomName: "Deluxe Room", bedType: "Double", cfg });
writeFileSync(`${base}/test-voucher.pdf`, voucher);
console.log("voucher ok", voucher.length, "bytes");

const invoice = await buildInvoicePdf({ booking, roomName: "Deluxe Room", bedType: "Double", cfg });
writeFileSync(`${base}/test-invoice.pdf`, invoice);
console.log("invoice ok", invoice.length, "bytes");
