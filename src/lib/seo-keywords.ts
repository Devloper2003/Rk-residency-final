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

/**
 * Per-page keyword sets (OWNER FEATURE, Nov 2026). One SiteContent row holds
 * a JSON object mapping a page key -> comma-separated keywords. A page with
 * its own set renders THAT set; every other page falls back to the global
 * "seo.keywords" list (then to the code defaults below).
 */
export const SEO_KEYWORDS_PAGES_CONTENT_KEY = "seo.keywords.pages";

/** The public pages the owner can give their own keyword list, in admin order. */
export const SEO_PAGES: { key: string; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "rooms", label: "Rooms", path: "/rooms" },
  { key: "dining", label: "Dining", path: "/dining" },
  { key: "gallery", label: "Gallery", path: "/gallery" },
  { key: "offers", label: "Offers", path: "/offers" },
  { key: "blog", label: "Blog", path: "/blog" },
  { key: "about", label: "About", path: "/about" },
  { key: "experiences", label: "Experiences", path: "/experiences" },
  { key: "festivals", label: "Festivals", path: "/festivals" },
  { key: "contact", label: "Contact", path: "/contact" },
];

const SEO_PAGE_KEYS = new Set(SEO_PAGES.map((p) => p.key));

/**
 * Map a request pathname to a page key. Detail pages (e.g. /rooms/deluxe,
 * /blog/some-post) inherit their section's set; unknown paths (policies,
 * booking-doc, ...) resolve to null -> global list.
 */
export function pageKeyForPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/" || clean === "") return "home";
  const first = clean.split("/").filter(Boolean)[0] || "";
  return SEO_PAGE_KEYS.has(first) ? first : null;
}

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

/**
 * Parse the stored per-page JSON ("{"home":"kw1, kw2","dining":"kw3"}") into
 * a clean Record<pageKey, string[]>. Unknown page keys are dropped so a
 * stale/hand-edited row can never inject sets for pages that do not exist.
 */
export function parsePageSets(raw: string | null | undefined): Record<string, string[]> {
  if (!raw) return {};
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return {}; }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (!SEO_PAGE_KEYS.has(key) || typeof value !== "string") continue;
    const list = parseKeywords(value);
    if (list.length > 0) out[key] = list;
  }
  return out;
}

/** Serialize per-page sets back into the compact stored JSON form. */
export function serializePageSets(sets: Record<string, string[]>): string {
  const clean: Record<string, string> = {};
  for (const [key, list] of Object.entries(sets)) {
    if (!SEO_PAGE_KEYS.has(key)) continue;
    const parsed = parseKeywords(list.join(","));
    if (parsed.length > 0) clean[key] = parsed.join(", ");
  }
  return JSON.stringify(clean);
}

/** Where a rendered keyword list came from — shown as the admin badge too. */
export type SeoKeywordsSource = "page" | "global" | "default";

/**
 * Resolve the effective keyword list for one page:
 *   1. the page's own admin-saved set  (source "page")
 *   2. the global admin-saved list     (source "global")
 *   3. the curated code defaults       (source "default")
 */
export function resolveSeoKeywords(
  pageKey: string | null,
  pageSets: Record<string, string[]>,
  globalList: string[],
): { keywords: string[]; source: SeoKeywordsSource } {
  if (pageKey && pageSets[pageKey]?.length) {
    return { keywords: pageSets[pageKey], source: "page" };
  }
  if (globalList.length > 0) return { keywords: globalList, source: "global" };
  return { keywords: [...DEFAULT_SEO_KEYWORDS], source: "default" };
}
