/**
 * seo-keywords.server.ts — DB access for admin-managed SEO keywords.
 * Server-only (imports the Prisma client); keep client components on
 * ./seo-keywords instead.
 */
import { db } from "@/lib/db";
import {
  DEFAULT_SEO_KEYWORDS,
  SEO_KEYWORDS_CONTENT_KEY,
  SEO_KEYWORDS_PAGES_CONTENT_KEY,
  pageKeyForPath,
  parseKeywords,
  parsePageSets,
  resolveSeoKeywords,
  type SeoKeywordsSource,
} from "./seo-keywords";

export type SeoKeywordsResult = {
  /** The effective live list for the requested path. */
  keywords: string[];
  /** "page" = this page's own admin set; "global" = the global admin list; "default" = code fallback. */
  source: SeoKeywordsSource;
  /** Resolved page key when a path was given (e.g. "home", "dining"). */
  pageKey: string | null;
  /** The owner's per-page sets (pageKey -> keywords), parsed and validated. */
  pageSets: Record<string, string[]>;
  /** The global admin-saved list (parsed), so callers can show the fallback. */
  globalKeywords: string[];
};

/** One DB read for both rows; never throws — DB down means code defaults. */
async function readSeoRows() {
  try {
    const rows = await db.siteContent.findMany({
      where: { key: { in: [SEO_KEYWORDS_CONTENT_KEY, SEO_KEYWORDS_PAGES_CONTENT_KEY] } },
      select: { key: true, value: true },
    });
    const global = rows.find((r) => r.key === SEO_KEYWORDS_CONTENT_KEY)?.value ?? "";
    const pagesRaw = rows.find((r) => r.key === SEO_KEYWORDS_PAGES_CONTENT_KEY)?.value ?? "";
    return {
      globalKeywords: parseKeywords(global),
      pageSets: parsePageSets(pagesRaw),
    };
  } catch {
    // DB down / table missing — fall through to empty (defaults apply).
    return { globalKeywords: [] as string[], pageSets: {} as Record<string, string[]> };
  }
}

/**
 * Read the effective primary keywords.
 *
 * With `path` (recommended — the middleware sets the x-rk-pathname header):
 *   the page's own admin set wins, then the global admin list, then the
 *   code defaults (resolveSeoKeywords).
 *
 * Without `path`: same as the global/homepage view (kept for callers that
 * render site-wide structured data without a request path).
 */
export async function getSeoKeywords(path?: string): Promise<SeoKeywordsResult> {
  const { globalKeywords, pageSets } = await readSeoRows();
  const pageKey = pageKeyForPath(path);
  const { keywords, source } = resolveSeoKeywords(pageKey, pageSets, globalKeywords);
  return { keywords, source, pageKey, pageSets, globalKeywords };
}
