/**
 * seo-keywords.ts — admin-managed primary SEO keywords.
 *
 * OWNER RULE (Nov 2026): the keywords that appear on the live website are
 * managed from Admin → SEO Keywords — NOT from code. The DEFAULT_SEO_KEYWORDS
 * list below is only a starting fallback: it is pre-filled in the admin
 * editor and used by the site ONLY while no admin-saved list exists. The
 * moment the owner saves a list, the database row wins everywhere
 * (<meta name="keywords"> on every page + Hotel JSON-LD on the homepage).
 *
 * Storage: one SiteContent row, key "seo.keywords", value = comma-separated.
 * No schema change needed — this rides on the existing SiteContent table.
 *
 * This file is client-safe (no db import) so the admin tab can reuse
 * parseKeywords + DEFAULT_SEO_KEYWORDS for its editor UI.
 */

export const SEO_KEYWORDS_CONTENT_KEY = "seo.keywords";
export const SEO_KEYWORDS_SECTION = "seo";
export const SEO_KEYWORDS_TYPE = "textarea";
export const SEO_KEYWORDS_LABEL = "Primary SEO keywords";

/** Hard caps so one bad paste can never bloat the HTML head. */
export const SEO_KEYWORDS_MAX_COUNT = 50;
export const SEO_KEYWORDS_MAX_LENGTH = 100;

/**
 * Fallback primary keywords, derived from the site's real positioning
 * (titles/descriptions already on the site: Banke Bihari Mandir, ISKCON,
 * satvik dining, Yamuna). Shown in the admin editor as the starting list;
 * replaced everywhere the moment the owner saves their own list.
 */
export const DEFAULT_SEO_KEYWORDS: string[] = [
  "hotel near Banke Bihari Mandir",
  "RK Residency Vrindavan",
  "hotels in Vrindavan",
  "hotel near ISKCON Vrindavan",
  "heritage hotel Vrindavan",
  "budget hotel in Vrindavan",
  "rooms near Banke Bihari Mandir",
  "family hotel Vrindavan",
  "satvik food Vrindavan",
  "Vrindavan hotel booking",
  "hotel near Yamuna Vrindavan",
  "best hotel in Vrindavan",
];

/**
 * Parse a raw keywords string (comma and/or newline separated) into a clean,
 * de-duplicated list. Trims whitespace, drops empties, collapses inner
 * whitespace, dedupes case-insensitively (keeps the FIRST spelling) and
 * enforces the max count / max length caps.
 */
export function parseKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n\r]+/)) {
    const kw = part.replace(/\s+/g, " ").trim();
    if (!kw || kw.length > SEO_KEYWORDS_MAX_LENGTH) continue;
    const dedupe = kw.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(kw);
    if (out.length >= SEO_KEYWORDS_MAX_COUNT) break;
  }
  return out;
}
