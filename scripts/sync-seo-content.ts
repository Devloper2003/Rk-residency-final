/**
 * sync-seo-content.ts — aligns admin-editable site content with the SEO copy
 * changes in the code (H1s, address, founding year, breakfast note, hero
 * subheadline, map embed).
 *
 * WHY: SiteContent rows OVERRIDE the code fallbacks at runtime. Without this
 * sync the public site keeps showing the old copy after hydration even
 * though the server HTML is correct.
 *
 * SAFE BY DESIGN: only the keys listed below are touched (update-in-place).
 * Nothing is deleted, no other row is modified. Idempotent — safe to re-run.
 *
 * RUN (owner, against production):
 *   DATABASE_URL="postgresql://…" bun run scripts/sync-seo-content.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const UPDATES: Record<string, string> = {
  // Task 1 — homepage H1 now carries the primary keyword; old tagline demoted
  // to an h2 (new key hero.tagline).
  "hero.headline_line1": "Hotel Near Banke Bihari Mandir,",
  "hero.headline_line2": "Vrindavan",
  "hero.tagline": "Where the spirit of Braj finds its rest",
  // Task 5 — no more "steps from" claims.
  "hero.subheadline":
    "A heritage-luxury residency minutes from Banke Bihari Mandir & ISKCON Vrindavan. Calm, dignified comfort for pilgrims, devotee families and cultural travellers.",
  // Task 1 — /about h1 keyword forms.
  "about.title_line1": "A heritage hotel in",
  "about.title_line2": "holy Vrindavan",
  // Task 7 — one founding year everywhere.
  "about.image_caption_label": "Heart of Vrindavan · Since 2024", // TODO: keep in sync with BUSINESS.establishedYear
  "about.stat_card_label": "Since 2024", // TODO: keep in sync with BUSINESS.establishedYear
  "footer.description":
    "A heritage-luxury residency on the banks of the Yamuna, welcoming pilgrims and devotee families since 2024. A guest is a visiting deity.", // TODO: keep in sync with BUSINESS.establishedYear
  // Task 6 — one address everywhere (Kailash Nagar).
  "contact.address_line1": "RK Residency, Kailash Nagar",
  "contact.address_full": "RK Residency, Kailash Nagar, Vrindavan, Mathura, UP 281121",
  // Task 5 — the about stats block is DB-editable; replace the vague
  // "Temples within 1.5 km" stat with the exact walk time.
  "about.stats": JSON.stringify([
    { end: 2, suffix: "", label: "Years of Braj hospitality" },
    { end: 35, suffix: "", label: "Rooms, suites " },
    { end: 48000, suffix: "+", label: "Devotee guests hosted" },
    { end: 6, suffix: "", label: "Min walk to Banke Bihari Mandir" },
  ]),
  // Task 10 — Google Maps embed replaces the OpenStreetMap iframe.
  "contact.map_embed_url":
    "https://www.google.com/maps?q=RK%20Residency%2C%20Kailash%20Nagar%2C%20Vrindavan%2C%20Mathura%2C%20UP%20281121&output=embed", // TODO: replace q= with the exact Google Maps place
};

async function main() {
  console.log("== sync-seo-content: start ==");
  let updated = 0;
  let created = 0;

  for (const [key, value] of Object.entries(UPDATES)) {
    const existing = await db.siteContent.findUnique({ where: { key } });
    if (existing) {
      if (existing.value === value) {
        console.log(`= ${key} already up to date`);
        continue;
      }
      await db.siteContent.update({ where: { key }, data: { value } });
      console.log(`✓ updated ${key}`);
      updated++;
    } else {
      await db.siteContent.create({
        data: {
          key,
          value,
          section: key.split(".")[0],
          type: "text",
          label: key,
        },
      });
      console.log(`+ created ${key}`);
      created++;
    }
  }

  console.log(`== done: ${updated} updated, ${created} created ==`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
