/**
 * seo-keywords.server.ts — DB access for admin-managed SEO keywords.
 * Server-only (imports the Prisma client); keep client components on
 * ./seo-keywords instead.
 */
import { db } from "@/lib/db";
import {
  DEFAULT_SEO_KEYWORDS,
  SEO_KEYWORDS_CONTENT_KEY,
  parseKeywords,
} from "./seo-keywords";

export type SeoKeywordsResult = {
  /** The effective live list — admin-saved when present, else the defaults. */
  keywords: string[];
  /** "custom" = owner saved a list from admin; "default" = code fallback. */
  source: "custom" | "default";
};

/**
 * Read the effective primary keywords. NEVER throws — if the DB is
 * unreachable the defaults are returned so every page still renders.
 */
export async function getSeoKeywords(): Promise<SeoKeywordsResult> {
  try {
    const row = await db.siteContent.findUnique({
      where: { key: SEO_KEYWORDS_CONTENT_KEY },
      select: { value: true },
    });
    const parsed = parseKeywords(row?.value);
    if (parsed.length > 0) return { keywords: parsed, source: "custom" };
  } catch {
    // DB down / table missing — fall through to defaults.
  }
  return { keywords: [...DEFAULT_SEO_KEYWORDS], source: "default" };
}
