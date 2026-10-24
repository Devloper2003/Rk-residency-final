/**
 * schema-org.ts — builders for JSON-LD structured data.
 *
 * RULES:
 *   - Rendered as <script type="application/ld+json"> in the SERVER HTML.
 *   - NEVER invent business data: fields whose value is an unfilled TODO in
 *     site.config are omitted from the output instead of being guessed.
 *   - All URLs are absolute, built from SITE_URL.
 */
import { BUSINESS, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "./site.config";
import { absUrl } from "./seo";

/** "2:00 PM" → "14:00" (schema.org Time). Returns undefined for unparsable input. */
function timeToSchemaTime(t: string): string | undefined {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  const mins = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${mins}`;
}

/** Absolute image URL — passes through http(s) URLs, resolves relative paths. */
function absoluteImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return absUrl(url);
}

/**
 * Hotel (LodgingBusiness) JSON-LD for the homepage.
 * - priceRange is derived from the live room prices when `rooms` is passed
 *   (real DB data), falling back to BUSINESS.priceRange.
 * - aggregateRating is emitted ONLY from REAL, verifiable data: the live
 *   Places API rating when provided (opts.rating), else BUSINESS.rating
 *   filled by the owner. Never invented.
 * - sameAs lists only real social/review URLs.
 */
export function hotelJsonLd(opts?: {
  rooms?: { basePrice: number }[];
  /** Live rating from the Google Places API — overrides BUSINESS.rating. */
  rating?: { value: string; count: string | number };
}) {
  const prices = (opts?.rooms || [])
    .map((r) => r.basePrice)
    .filter((n) => Number.isFinite(n) && n > 0);

  // Widen the `as const` empty-string literal so truthiness checks typecheck.
  const cfgPriceRange: string = BUSINESS.priceRange;
  const priceRange =
    (cfgPriceRange && cfgPriceRange.trim()) ||
    (prices.length ? `₹${Math.min(...prices).toLocaleString("en-IN")} – ₹${Math.max(...prices).toLocaleString("en-IN")}` : undefined);

  const checkin = timeToSchemaTime(BUSINESS.checkinTime);
  const checkout = timeToSchemaTime(BUSINESS.checkoutTime);

  const sameAs = [
    BUSINESS.social.instagram,
    BUSINESS.social.facebook,
    BUSINESS.social.youtube,
    BUSINESS.reviews.google,
    BUSINESS.reviews.tripadvisor,
  ].filter(Boolean) as string[];

  const geo =
    BUSINESS.geo.latitude && BUSINESS.geo.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: BUSINESS.geo.latitude,
          longitude: BUSINESS.geo.longitude,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteImage(DEFAULT_OG_IMAGE),
    description: "Heritage hotel in Vrindavan near Banke Bihari Mandir — satvik dining, serene rooms and concierge darshan assistance on the banks of the Yamuna.",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.addressLocality,
      addressRegion: BUSINESS.address.addressRegion,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.addressCountry,
    },
    ...(geo ? { geo } : {}),
    ...(BUSINESS.phonePrimary ? { telephone: BUSINESS.phonePrimary } : {}),
    ...(BUSINESS.emailPrimary ? { email: BUSINESS.emailPrimary } : {}),
    ...(checkin ? { checkinTime: checkin } : {}),
    ...(checkout ? { checkoutTime: checkout } : {}),
    ...(BUSINESS.amenities.length
      ? {
          amenityFeature: BUSINESS.amenities.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
        }
      : {}),
    ...(priceRange ? { priceRange } : {}),
    ...((opts?.rating?.value && opts?.rating?.count) || (BUSINESS.rating.value && BUSINESS.rating.count)
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts?.rating?.value || BUSINESS.rating.value,
            reviewCount: opts?.rating?.count ?? BUSINESS.rating.count,
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * FAQPage JSON-LD built from the SAME FAQ data the section renders,
 * so questions and answers in the schema always match the visible copy.
 */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * BreadcrumbList JSON-LD for inner pages.
 * items: ordered trail, e.g. [{ name: "Home", path: "/" }, { name: "Rooms", path: "/rooms" }]
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

/** BlogPosting JSON-LD for a blog post (server-rendered on /blog/[slug]). */
export function blogPostingJsonLd(post: {
  title: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(absoluteImage(post.imageUrl) ? { image: absoluteImage(post.imageUrl) } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absUrl("/images/hero-vrindavan.webp"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absUrl(`/blog/${post.slug}`),
    },
  };
}

/** CollectionPage JSON-LD for the /blog listing page. */
export function collectionPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Braj Journal",
    description: "Temple guides, festival calendars and local tips from our resident scholars and concierge team.",
    url: absUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
