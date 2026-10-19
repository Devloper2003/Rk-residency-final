/**
 * fix-content-mismatches.ts — one-time content cleanup matching the owner's
 * Phase 4 fix list. Idempotent; touches ONLY these SiteContent rows:
 *   1. faq.items — remove the sample front-desk phone number; unify late
 *      check-out to 1 PM (matches the homepage promise).
 *   2. hero.rating_text / testimonials.aggregate_rating — cleared: the
 *      "4.9 · 1,240+ verified stays" claim has no verifiable source, so it
 *      is removed until the owner provides a real Google/TripAdvisor link.
 *      (It was never emitted in JSON-LD schema — nothing to change there.)
 * Bookings, rooms, guests and all other data are untouched.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // 1. faq.items — surgical string fixes
  const faqRow = await db.siteContent.findUnique({ where: { key: "faq.items" } });
  if (faqRow) {
    let v = faqRow.value;
    const before = v;
    v = v.replace(
      /call our front desk at \+91 565 234 5678\.? ?/i,
      "use the booking widget or the contact form. "
    );
    v = v.replace(
      /Late check-out till 2 PM is complimentary on request\.?/i,
      "Late check-out till 1 PM is available on request, subject to availability."
    );
    if (v !== before) {
      await db.siteContent.update({ where: { key: "faq.items" }, data: { value: v } });
      console.log("faq.items: fixed phone reference + late check-out time");
    } else {
      console.log("faq.items: already clean");
    }
  }

  // 2. unverified rating claims
  for (const key of ["hero.rating_text", "testimonials.aggregate_rating"]) {
    const row = await db.siteContent.findUnique({ where: { key } });
    if (row && row.value.trim() !== "") {
      await db.siteContent.update({ where: { key }, data: { value: "" } });
      console.log(`${key}: cleared (unverified rating claim)`);
    } else {
      console.log(`${key}: already empty`);
    }
  }

  console.log("done");
}
main().finally(() => db.$disconnect());
