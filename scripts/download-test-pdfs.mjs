// Download actual PDFs from production using admin auth
// Step 1: Login as admin to get token
// Step 2: Download voucher + invoice for a real booking
// Step 3: Save to /tmp for analysis

const PROD = "https://rk-residency-final-three.vercel.app";
const ADMIN_EMAIL = "sujeet@rkresidency.in";
const ADMIN_PASSWORD = "Sujeet@123";

try {
  // Login
  console.log("Logging in as admin...");
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
  console.log("✓ Login successful, token acquired");

  // Get a real booking ID
  console.log("Fetching booking list...");
  const listRes = await fetch(`${PROD}/api/admin/all?action=bookings&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const bookings = listData.bookings || [];
  console.log(`Found ${bookings.length} bookings`);
  for (const b of bookings.slice(0, 5)) {
    console.log(`  ${b.id}  ${b.referenceCode}  ${b.guestName}  ${b.status}`);
  }

  if (bookings.length === 0) {
    console.error("No bookings found");
    process.exit(1);
  }

  // Use the most recent CONFIRMED booking, or just the first one
  const targetBooking = bookings.find(b => b.status === "CONFIRMED") || bookings[0];
  console.log(`\nUsing booking: ${targetBooking.referenceCode} (${targetBooking.id})`);

  // Download Voucher PDF
  console.log("\nDownloading Voucher PDF...");
  const vouchRes = await fetch(`${PROD}/api/booking-pdf/${targetBooking.id}?type=voucher`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!vouchRes.ok) {
    const errText = await vouchRes.text();
    console.error(`Voucher download failed: HTTP ${vouchRes.status}`, errText);
  } else {
    const vouchBuf = Buffer.from(await vouchRes.arrayBuffer());
    const fs = await import("fs");
    fs.writeFileSync("/tmp/test-voucher.pdf", vouchBuf);
    console.log(`✓ Voucher saved: /tmp/test-voucher.pdf (${vouchBuf.length} bytes)`);
    console.log(`  Magic: ${vouchBuf.slice(0, 5).toString("latin1")}`);
  }

  // Download Invoice PDF
  console.log("\nDownloading Invoice PDF...");
  const invRes = await fetch(`${PROD}/api/booking-pdf/${targetBooking.id}?type=invoice`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!invRes.ok) {
    const errText = await invRes.text();
    console.error(`Invoice download failed: HTTP ${invRes.status}`, errText);
  } else {
    const invBuf = Buffer.from(await invRes.arrayBuffer());
    const fs = await import("fs");
    fs.writeFileSync("/tmp/test-invoice.pdf", invBuf);
    console.log(`✓ Invoice saved: /tmp/test-invoice.pdf (${invBuf.length} bytes)`);
    console.log(`  Magic: ${invBuf.slice(0, 5).toString("latin1")}`);
  }

} catch (e) {
  console.error("Error:", e.message);
  console.error(e.stack);
  process.exit(1);
}
