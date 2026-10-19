/**
 * image-aliases.ts — runtime alias map for descriptive upload filenames.
 *
 * WHY THIS EXISTS
 *   The SEO image-filename migration (scripts/rename-existing-uploads.ts)
 *   renames hash-named MediaAsset rows (e.g. 5da7e5a732c7d5e5.webp) to
 *   descriptive slugs (rk-residency-vrindavan-satvik-thali.webp) and updates
 *   every reference. Code and NEW uploads already use the descriptive names.
 *
 *   Until the owner runs that one-time script against the production
 *   database, the DB rows still carry the OLD hash names while the site
 *   requests the NEW descriptive names — so every descriptive /uploads/*.webp
 *   URL would 404. Instead of silently mutating the production database,
 *   the /uploads/[filename] route uses THIS map as a read-only fallback:
 *   if a descriptive name is requested but not found, the legacy row is
 *   served under the requested name. Nothing is written or renamed.
 *
 *   Running scripts/rename-existing-uploads.ts remains the permanent fix —
 *   after it runs, every descriptive name resolves directly and this
 *   fallback is never hit.
 *
 * Mirrors the RENAMES map in scripts/rename-existing-uploads.ts
 * (descriptive slug -> legacy content-hash filename).
 */
export const IMAGE_ALIASES: Record<string, string> = {
  // Brand / chrome
  "rk-residency-vrindavan-logo.webp": "4554e352db41d79f.webp",
  "rk-residency-vrindavan-hero.webp": "1b353f97f07cb823.webp",

  // Rooms / property
  "rk-residency-vrindavan-heritage-room.webp": "5b87a4725175feac.webp",
  // Owner-uploaded property photos (used on room pages until per-room photos
  // are added) — interior, reception, exterior day/night.
  "rk-residency-vrindavan-deluxe-room.webp": "843253c06bc5fb53.webp",
  "rk-residency-vrindavan-reception.webp": "74f937ec32c5b7c6.webp",
  "rk-residency-vrindavan-reception-portrait.webp": "915a052e8236a229.webp",
  "rk-residency-vrindavan-hotel-exterior.webp": "dd88570b240cc0ef.webp",
  "rk-residency-vrindavan-hotel-exterior-night.webp": "5b87a4725175feac.webp",

  // Dining
  "rk-residency-vrindavan-satvik-thali.webp": "5da7e5a732c7d5e5.webp",
  "rk-residency-vrindavan-satvik-dining.webp": "7233f537e89c11fd.webp",
  "rk-residency-vrindavan-braj-thali.webp": "7ff0f47ff2a66e6b.webp",

  // Temples & experiences
  "rk-residency-vrindavan-banke-bihari-mandir.webp": "a78f283997ee8a40.webp",
  "rk-residency-vrindavan-iskcon-temple.webp": "d8278639f939d1d5.webp",
  "rk-residency-vrindavan-prem-mandir.webp": "d624900c0a75cde5.webp",
  "rk-residency-vrindavan-nidhivan.webp": "cd5954906d1083df.webp",
  "rk-residency-vrindavan-yamuna-aarti-keshi-ghat.webp": "63e4076580ba26bc.webp",
  "rk-residency-vrindavan-banke-bihari-mandir-gate.webp": "3c15d4a30a5b3073.webp",
  "rk-residency-vrindavan-prem-mandir-night.webp": "ce4bce1d00cb8882.webp",
  "rk-residency-vrindavan-radha-rani-temple-barsana.webp": "4eb433665c6fa58f.webp",

  // Rituals & festivals
  "rk-residency-vrindavan-temple-skyline-sunrise.webp": "77c2e9079bcad2e4.webp",
  "rk-residency-vrindavan-keshi-ghat.webp": "e7945e7017587391.webp",
  "rk-residency-vrindavan-yamuna-aarti-diyas.webp": "bc1472b2bdcf41a1.webp",
  "rk-residency-vrindavan-prem-mandir-marble-detail.webp": "602dc906088e4031.webp",
  "rk-residency-vrindavan-marigold-diya-offerings.webp": "e120b636d3572317.webp",
  "rk-residency-vrindavan-iskcon-kirtan.webp": "59eababd45bb5dda.webp",
  "rk-residency-vrindavan-holi-colours.webp": "430045b2d369a607.webp",
  "rk-residency-vrindavan-boat-festival.webp": "af2e8feb184ff8c2.webp",
  "rk-residency-vrindavan-yamuna-river-view.webp": "e38ce58bc7bd3dbb.webp",
};
