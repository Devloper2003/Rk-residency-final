/**
 * seo.ts — shared helpers for page metadata.
 *
 * RULES enforced here:
 *   - <title> must stay under 60 characters.
 *   - meta description must stay under 155 characters.
 *   - canonicals are always built from SITE_URL (never hardcoded domains).
 */
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site.config";

/** Hard limits from the SEO spec. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/**
 * Build a page <title> from a page-specific title and append the brand
 * suffix when there is room, guaranteeing the result stays under 60 chars.
 */
export function seoTitle(pageTitle: string, brand: string = SITE_NAME): string {
  const clean = pageTitle.trim().replace(/\s+/g, " ");
  if (clean.length <= TITLE_MAX) return clean;
  const withBrand = `${clean} — ${brand}`;
  if (withBrand.length <= TITLE_MAX) return withBrand;
  return clean.slice(0, TITLE_MAX - 1).trimEnd() + "…";
}

/**
 * Build a page <title> of the form "Page — Brand", total under 60 chars.
 */
export function titledPageTitle(pageTitle: string, brand: string = SITE_NAME): string {
  const clean = pageTitle.trim().replace(/\s+/g, " ");
  const withBrand = `${clean} — ${brand}`;
  if (withBrand.length <= TITLE_MAX) return withBrand;
  return seoTitle(clean, brand);
}

/**
 * Trim a meta description to 155 characters without cutting mid-word.
 */
export function seoDescription(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= DESCRIPTION_MAX) return clean;
  const cut = clean.slice(0, DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/**
 * Absolute canonical URL for a path, e.g. absUrl("/rooms/xyz").
 * The path must start with "/". Query strings are ignored by design —
 * canonicals must point at the clean, indexable URL.
 */
export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Open Graph metadata for a page. og:url always equals the page canonical;
 * title/description are the page's own; image defaults to the brand hero
 * unless the page has a more specific one. Relative image paths are resolved
 * against metadataBase (set in the root layout from SITE_URL).
 */
export function pageOpenGraph(opts: {
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
}): Metadata["openGraph"] {
  return {
    title: opts.title,
    description: opts.description,
    url: absUrl(opts.path),
    siteName: SITE_NAME,
    locale: "en_IN",
    type: opts.type ?? "website",
    images: [
      {
        url: opts.image || "/images/hero-vrindavan.webp",
        width: 1344,
        height: 768,
        alt: opts.title,
      },
    ],
  };
}

/** Twitter card metadata matching the page's OG tags. */
export function pageTwitter(opts: {
  title: string;
  description: string;
  image?: string;
}): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title: opts.title,
    description: opts.description,
    images: [opts.image || "/images/hero-vrindavan.webp"],
  };
}
