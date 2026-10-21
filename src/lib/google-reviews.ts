/**
 * google-reviews.ts — server-side fetch of the hotel's LIVE Google reviews
 * via the Google Places API (New).
 *
 * Requires ONE owner-supplied value:
 *   GOOGLE_PLACES_API_KEY — env var (set in Vercel → Settings →
 *   Environment Variables). NEVER committed to git.
 *
 *   BUSINESS.reviews.googlePlaceId is OPTIONAL: when it is empty the
 *   function auto-resolves the property with ONE Text Search (New) call
 *   using the hotel name + the pin coordinates taken from the owner's
 *   maps.app.goo.gl share link. The result is cached, so the real Place
 *   ID does not need to be looked up by hand.
 *
 * When the key is missing (or every lookup fails) the function returns
 * null and the site falls back to owner-moderated guest reviews from the
 * database — nothing is invented.
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
  id?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
};

// ─── Auto-resolution of the hotel's Place ID (no manual lookup needed) ──────
// Query and pin coordinates come from the owner's real Google listing
// (https://maps.app.goo.gl/EWLnPhdXAqbgmJ9Q6 → "Hotel RK Residency",
// @27.5653,77.684057). The locationBias pins the search to the exact area
// so the first result is the correct property.
const PLACE_SEARCH_QUERY = "Hotel RK Residency Vrindavan";
const PLACE_SEARCH_CENTER = { latitude: 27.5653, longitude: 77.684057 };

/** Transform a Places API place object into our public shape (or null). */
function toReviewsData(data: PlacesDetails): GoogleReviewsData | null {
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
}

/** Place Details (New) — used when the Place ID is already known. */
async function fetchPlaceDetails(
  key: string,
  placeId: string
): Promise<GoogleReviewsData | null> {
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
  return toReviewsData((await res.json()) as PlacesDetails);
}

/**
 * Text Search (New) — resolves the property AND its review data in one
 * cached call. Used only when no Place ID is configured yet.
 */
async function resolveViaTextSearch(
  key: string
): Promise<GoogleReviewsData | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.rating,places.userRatingCount,places.reviews",
    },
    body: JSON.stringify({
      textQuery: PLACE_SEARCH_QUERY,
      languageCode: "en",
      locationBias: {
        circle: { center: PLACE_SEARCH_CENTER, radius: 3000 },
      },
    }),
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    console.error("[google-reviews] Text Search error:", res.status);
    return null;
  }
  const data: { places?: PlacesDetails[] } = await res.json();
  const place = data.places?.[0];
  if (!place?.id) return null;
  console.log(
    `[google-reviews] resolved Place ID via Text Search: ${place.id}`
  );
  return toReviewsData(place);
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const placeId = BUSINESS.reviews.googlePlaceId || process.env.GOOGLE_PLACE_ID;

  try {
    if (placeId) return await fetchPlaceDetails(key, placeId);
    // No Place ID configured — auto-resolve the property via Text Search.
    return await resolveViaTextSearch(key);
  } catch (e) {
    console.error("[google-reviews] fetch failed:", e);
    return null;
  }
}
