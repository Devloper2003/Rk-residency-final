/**
 * rename-existing-uploads.ts — ONE-TIME migration for the production database.
 *
 * WHAT IT DOES
 *   1. Renames hash-named MediaAsset rows (e.g. 430045b2d369a607.webp) to
 *      descriptive, keyword-relevant slugs (rk-residency-vrindavan-*.webp).
 *   2. Fills in natural, descriptive alt text for each renamed image.
 *   3. Backfills contentHash so identical uploads keep deduping.
 *   4. Updates EVERY reference to the old filename across the database:
 *      SiteContent.value, Room.imageUrls, BlogPost.imageUrl, Offer.imageUrl.
 *
 * NOTHING IS DELETED. Rows are renamed in place; if a row or reference is
 * missing it is skipped and reported.
 *
 * HOW TO RUN (owner)
 *   # against production (PostgreSQL on Vercel) — run BEFORE deploying the
 *   # code that references the new filenames:
 *   DATABASE_URL="postgresql://…" bun run scripts/rename-existing-uploads.ts
 *
 *   The script is idempotent — running it twice is a no-op.
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

/**
 * hash → descriptive slug + natural alt text.
 * Mapping derived from how each image is used on the site (gallery captions,
 * experience names, section context).
 */
const RENAMES: Record<string, { filename: string; alt: string }> = {
  // Brand / chrome
  "4554e352db41d79f": { filename: "rk-residency-vrindavan-logo.webp", alt: "RK Residency Vrindavan hotel logo" },
  "1b353f97f07cb823": { filename: "rk-residency-vrindavan-hero.webp", alt: "RK Residency Vrindavan hotel near Banke Bihari Mandir at golden hour" },

  // Rooms / property
  "5b87a4725175feac": { filename: "rk-residency-vrindavan-heritage-room.webp", alt: "Heritage room interior at RK Residency Vrindavan with jharokha window" },

  // Dining
  "5da7e5a732c7d5e5": { filename: "rk-residency-vrindavan-satvik-thali.webp", alt: "Satvik thali served on a heritage brass plate at RK Residency Vrindavan" },
  "7233f537e89c11fd": { filename: "rk-residency-vrindavan-satvik-dining.webp", alt: "Satvik dining at the rooftop restaurant of RK Residency Vrindavan" },
  "7ff0f47ff2a66e6b": { filename: "rk-residency-vrindavan-braj-thali.webp", alt: "Satvik Braj thali on a brass plate at RK Residency" },

  // Temples & experiences
  "a78f283997ee8a40": { filename: "rk-residency-vrindavan-banke-bihari-mandir.webp", alt: "Banke Bihari Mandir, Vrindavan — a short walk from RK Residency" },
  "d8278639f939d1d5": { filename: "rk-residency-vrindavan-iskcon-temple.webp", alt: "ISKCON Sri Krishna Balaram Mandir, Vrindavan" },
  "d624900c0a75cde5": { filename: "rk-residency-vrindavan-prem-mandir.webp", alt: "Prem Mandir, Vrindavan — white marble temple near RK Residency" },
  "cd5954906d1083df": { filename: "rk-residency-vrindavan-nidhivan.webp", alt: "Nidhivan sacred grove, Vrindavan" },
  "63e4076580ba26bc": { filename: "rk-residency-vrindavan-yamuna-aarti-keshi-ghat.webp", alt: "Yamuna aarti ceremony at Keshi Ghat, Vrindavan" },
  "3c15d4a30a5b3073": { filename: "rk-residency-vrindavan-banke-bihari-mandir-gate.webp", alt: "Entrance gate of Banke Bihari Mandir, Vrindavan" },
  "ce4bce1d00cb8882": { filename: "rk-residency-vrindavan-prem-mandir-night.webp", alt: "Prem Mandir illuminated at night, Vrindavan" },
  "4eb433665c6fa58f": { filename: "rk-residency-vrindavan-radha-rani-temple-barsana.webp", alt: "Radha Rani Temple on the hills of Barsana" },

  // Rituals & festivals
  "77c2e9079bcad2e4": { filename: "rk-residency-vrindavan-temple-skyline-sunrise.webp", alt: "Sunrise over the Vrindavan temple skyline" },
  "e7945e7017587391": { filename: "rk-residency-vrindavan-keshi-ghat.webp", alt: "Historic temple corridor at Keshi Ghat on the Yamuna, Vrindavan" },
  "bc1472b2bdcf41a1": { filename: "rk-residency-vrindavan-yamuna-aarti-diyas.webp", alt: "Yamuna aarti at dusk with floating diyas, Vrindavan" },
  "602dc906088e4031": { filename: "rk-residency-vrindavan-prem-mandir-marble-detail.webp", alt: "Intricate hand-carved marble detail at Prem Mandir, Vrindavan" },
  "e120b636d3572317": { filename: "rk-residency-vrindavan-marigold-diya-offerings.webp", alt: "Marigold garlands and diya offerings at a Vrindavan temple" },
  "59eababd45bb5dda": { filename: "rk-residency-vrindavan-iskcon-kirtan.webp", alt: "Evening kirtan at ISKCON Temple, Vrindavan" },
  "430045b2d369a607": { filename: "rk-residency-vrindavan-holi-colours.webp", alt: "Holi festival gulal colours in Braj, Vrindavan" },
  "af2e8feb184ff8c2": { filename: "rk-residency-vrindavan-boat-festival.webp", alt: "Boat festival on the Yamuna at ISKCON Temple, Vrindavan" },
  "e38ce58bc7bd3dbb": { filename: "rk-residency-vrindavan-yamuna-river-view.webp", alt: "Yamuna river view with birds at sunset, Vrindavan" },
};

async function updateReferences(oldName: string, newName: string): Promise<number> {
  let touched = 0;

  // SiteContent — plain string values (may contain several URLs)
  const contents = await db.siteContent.findMany({
    where: { value: { contains: oldName } },
  });
  for (const c of contents) {
    await db.siteContent.update({
      where: { id: c.id },
      data: { value: c.value.split(oldName).join(newName) },
    });
    touched++;
  }

  // SiteSetting — same treatment
  const settings = await db.siteSetting.findMany({
    where: { value: { contains: oldName } },
  });
  for (const s of settings) {
    await db.siteSetting.update({
      where: { id: s.id },
      data: { value: s.value.split(oldName).join(newName) },
    });
    touched++;
  }

  // Room.imageUrls — JSON array of strings
  const rooms = await db.room.findMany({ where: { imageUrls: { contains: oldName } } });
  for (const r of rooms) {
    try {
      const arr: string[] = JSON.parse(r.imageUrls || "[]");
      const next = JSON.stringify(arr.map((u) => u.split(oldName).join(newName)));
      await db.room.update({ where: { id: r.id }, data: { imageUrls: next } });
      touched++;
    } catch {
      console.warn(`  ! Room ${r.id}: imageUrls is not valid JSON — skipped`);
    }
  }

  // BlogPost.imageUrl
  const posts = await db.blogPost.findMany({ where: { imageUrl: { contains: oldName } } });
  for (const p of posts) {
    await db.blogPost.update({
      where: { id: p.id },
      data: { imageUrl: (p.imageUrl || "").split(oldName).join(newName) },
    });
    touched++;
  }

  // Offer.imageUrl
  const offers = await db.offer.findMany({ where: { imageUrl: { contains: oldName } } });
  for (const o of offers) {
    await db.offer.update({
      where: { id: o.id },
      data: { imageUrl: (o.imageUrl || "").split(oldName).join(newName) },
    });
    touched++;
  }

  return touched;
}

async function main() {
  console.log("== rename-existing-uploads: start ==");
  let renamed = 0;
  let skipped = 0;

  for (const [hash, { filename: newFilename, alt }] of Object.entries(RENAMES)) {
    const oldFilename = `${hash}.webp`;
    const asset = await db.mediaAsset.findUnique({ where: { filename: oldFilename } });

    if (!asset) {
      // Already renamed (idempotent re-run) or never existed.
      const already = await db.mediaAsset.findUnique({ where: { filename: newFilename } });
      if (already) {
        console.log(`= ${oldFilename} already renamed to ${newFilename}`);
        skipped++;
      } else {
        console.log(`? ${oldFilename} not found in MediaAsset — skipped (nothing to rename)`);
        skipped++;
      }
      continue;
    }

    const clash = await db.mediaAsset.findUnique({ where: { filename: newFilename } });
    if (clash && clash.id !== asset.id) {
      console.warn(`! ${newFilename} already exists (different row) — leaving ${oldFilename} untouched`);
      skipped++;
      continue;
    }

    // Backfill contentHash (sha256 of the stored bytes) for dedupe.
    let contentHash = asset.contentHash;
    if (!contentHash) {
      const bytes = Buffer.from(asset.data as unknown as Uint8Array);
      contentHash = crypto.createHash("sha256").update(bytes).digest("hex");
    }

    await db.mediaAsset.update({
      where: { id: asset.id },
      data: { filename: newFilename, alt, contentHash },
    });

    const refs = await updateReferences(oldFilename, newFilename);
    console.log(`✓ ${oldFilename} → ${newFilename} (alt set; ${refs} reference row(s) updated)`);
    renamed++;
  }

  console.log(`== done: ${renamed} renamed, ${skipped} skipped/no-op ==`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
