/**
 * clear-placeholder-contact.ts — one-time cleanup of PLACEHOLDER contact
 * data that was seeded into older databases.
 *
 * What it does (idempotent — safe to run again):
 *   1. Clears dummy phone / WhatsApp / email / social-link SiteSetting rows
 *      (the old sample numbers and generic instagram.com-style homepages).
 *      Real values must come from the owner via Admin → Settings.
 *   2. Fixes legacy "Parikrama Marg" address rows to the real Kailash Nagar
 *      address (matches site.config single source of truth).
 *   3. Replaces the generic "Vrindavan, UP" directions URL with a real
 *      Google Maps directions link to the business address.
 *
 * It NEVER touches bookings, guests, rooms, reviews or any other data.
 *
 * Run:  bun scripts/clear-placeholder-contact.ts   (or npx tsx scripts/...)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const KAILASH_LINE1 = "RK Residency, Kailash Nagar";
const KAILASH_FULL = "RK Residency, Kailash Nagar, Vrindavan, Mathura, UP 281121";
const REAL_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=RK%20Residency%2C%20Kailash%20Nagar%2C%20Vrindavan%2C%20Mathura%2C%20UP%20281121";

/** Known placeholder values → cleared to "". */
const CLEAR_VALUES = new Set([
  "919876543210", // sample WhatsApp number
  "+91 98765 43210", // sample reservations phone
  "+91 565 234 5678", // sample primary phone
  "+915652345678",
  "stay@rkresidency.in", // unverified emails — owner confirms via Settings
  "events@rkresidency.in",
  "https://instagram.com", // generic social homepages, not real profiles
  "https://facebook.com",
  "https://youtube.com",
  "https://www.tripadvisor.in",
  "https://www.google.com/travel/hotels",
]);

const CLEAR_KEYS = [
  "phone_primary",
  "phone_primary_tel",
  "phone_reservations",
  "whatsapp_number",
  "email_primary",
  "email_events",
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "tripadvisor_url",
  "google_reviews_url",
];

async function main() {
  let cleared = 0;
  let fixedAddress = 0;
  let fixedDirections = 0;

  for (const key of CLEAR_KEYS) {
    const row = await db.siteSetting.findUnique({ where: { key } });
    if (!row) continue;
    if (CLEAR_VALUES.has(row.value.trim()) || row.value.trim() === "") {
      if (row.value.trim() !== "") {
        await db.siteSetting.update({ where: { key }, data: { value: "" } });
        console.log(`cleared placeholder: ${key} (was "${row.value}")`);
        cleared++;
      }
    } else {
      console.log(`kept real value: ${key} = "${row.value}"`);
    }
  }

  // Legacy address wording (Parikrama Marg → Kailash Nagar)
  for (const key of ["address_line1", "address_full", "contact.address_line1", "contact.address_full"]) {
    const row = await db.siteSetting.findUnique({ where: { key } }).catch(() => null);
    if (!row) continue;
    const wanted = key.endsWith("_full") ? KAILASH_FULL : KAILASH_LINE1;
    if (row.value.toLowerCase().includes("parikrama")) {
      await db.siteSetting.update({ where: { key }, data: { value: wanted } });
      console.log(`fixed address row: ${key} → "${wanted}"`);
      fixedAddress++;
    }
  }

  // Generic directions URL → real address-based one
  const dirRow = await db.siteSetting.findUnique({ where: { key: "map_directions_url" } }).catch(() => null);
  if (dirRow && dirRow.value.includes("destination=Vrindavan%20Uttar%20Pradesh")) {
    await db.siteSetting.update({ where: { key: "map_directions_url" }, data: { value: REAL_DIRECTIONS_URL } });
    console.log("fixed map_directions_url → real business-address directions link");
    fixedDirections++;
  }

  console.log(`\nDone. cleared=${cleared} addressFixed=${fixedAddress} directionsFixed=${fixedDirections}`);
  console.log("Next step: fill REAL phone/WhatsApp/email/social values in Admin → Settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
