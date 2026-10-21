/**
 * google-reviews.ts — server-side fetch of the hotel's LIVE Google reviews
 * via the Google Places API (New).
 *
 * Requires TWO owner-supplied values:
 *   1. GOOGLE_PLACES_API_KEY — env var (set in Vercel → Settings →
 *      Environment Variables). NEVER committed to git.
 *   2. BUSINESS.reviews.googlePlaceId — the hotel's Google Place ID
 *      (src/lib/site.config.ts).
 *
 * When either is missing the function returns null and the site falls back
 * to owner-moderated guest reviews from the database — nothing is invented.
 *
 * The Places API response is cached for 24 hours via the Next.js Data
 * Cache (`next.revalidate`), so the site makes roughly ONE API call per day
 * — comfortably inside the Places API free tier.
 *
 * Data returned is EXACTLY what Google shows publicly on the hotel's
 * Business Profile: the aggregate rating, the total rating count, and up to
 * 5 of Google's most relevant written reviews.
 */

import { BUSINESS } from "./site.config";

export type GoogleReview = {
  /** Reviewer display name, e.g. "Rahul S." */
  author: string;
  /** 1–5 star rating of this single review. */
  rating: number;
  /** Full review text as shown on Google. */
  text: string;
  /** Google's own relative timestamp, e.g. "2 months ago". */
  relativeTime: string;
  /** Google profile photo URL of the reviewer, when available. */
  profilePhotoUrl: string | null;
  /** Direct link to the review on Google, when available. */
  authorUrl: string | null;
};

export type GoogleReviewsData = {
  /** Aggregate rating exactly as Google shows it, e.g. "4.3". */
  rating: string;
  /** Total number of Google ratings, e.g. 27. */
  count: number;
  /** Up to 5 written reviews (Google's "most relevant" selection). */
  reviews: GoogleReview[];
};

// ─── Places API (New) response shapes (only the fields we request) ─────────
type PlacesReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
};
type PlacesDetails = {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
};

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = BUSINESS.reviews.googlePlaceId || process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          // Field mask keeps the request minimal + cheapest possible.
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        // 24h Data Cache — the review wall does not need to be real-time.
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) {
      console.error("[google-reviews] Places API error:", res.status);
      return null;
    }
    const data: PlacesDetails = await res.json();

    const reviews: GoogleReview[] = (data.reviews || [])
      .map((r) => ({
        author: r.authorAttribution?.displayName || "Google guest",
        rating: Math.round(r.rating || 0),
        text: r.text?.text || r.originalText?.text || "",
        relativeTime: r.relativePublishTimeDescription || "",
        profilePhotoUrl: r.authorAttribution?.photoUri || null,
        authorUrl: r.authorAttribution?.uri || null,
      }))
      .filter((r) => r.text.length > 0);

    if (!data.rating && reviews.length === 0) return null;

    return {
      rating: data.rating ? String(data.rating) : "",
      count: data.userRatingCount || reviews.length,
      reviews,
    };
  } catch (e) {
    console.error("[google-reviews] fetch failed:", e);
    return null;
  }
}
