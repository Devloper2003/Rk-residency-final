// Download Voucher + Invoice PDFs from production, render to PNG, save for analysis
import fs from "fs";

const PROD = "https://rk-residency-final-three.vercel.app";
const ADMIN_EMAIL = "sujeet@rkresidency.in";
const ADMIN_PASSWORD = "Sujeet@123";

try {
  // Login
  const loginRes = await fetch(`${PROD}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, mode: "login" }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    console.error("Login failed:", loginData);
    process.exit(1);
  }
  const token = loginData.token;

  // Get booking list
  const listRes = await fetch(`${PROD}/api/admin/all?action=bookings&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const bookings = listData.bookings || [];
  // Pick a booking with a large total amount to expose overlap
  const target = bookings.find(b => b.totalAmount > 5000) || bookings[0];
  console.log(`Using booking: ${target.referenceCode} (₹${target.totalAmount})`);

  for (const type of ["voucher", "invoice"]) {
    const res = await fetch(`${PROD}/api/booking-pdf/${target.id}?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`${type} failed: HTTP ${res.status}`, await res.text());
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(`/tmp/audit-${type}.pdf`, buf);
    console.log(`✓ ${type}: /tmp/audit-${type}.pdf (${buf.length} bytes)`);
  }
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
