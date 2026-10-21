/**
 * site.config.ts — SINGLE SOURCE OF TRUTH for site-wide URLs and business data.
 *
 * URL RULE (SEO):
 *   Every canonical, og:url, sitemap URL and redirect target MUST be built from
 *   SITE_URL below. Never hardcode a domain anywhere else in the codebase.
 *
 * BUSINESS DATA POLICY:
 *   We never invent business data. Every value marked `TODO` below is a
 *   placeholder that the site owner MUST fill in. They are collected in one
 *   place so nothing is scattered across components.
 *
 *   NOTE: Most contact/social values are ALSO editable at runtime from the
 *   admin panel (Admin → Settings / Content). The DB value (SiteSetting table)
 *   always wins over the defaults here. The defaults exist only so that a
 *   fresh/empty database never renders invented data.
 */

/**
 * Canonical production origin, with protocol. Trailing slash is stripped.
 * Set the SITE_URL environment variable in production (Vercel → Settings →
 * Environment Variables) to the FINAL domain, e.g.:
 *   SITE_URL=https://www.rkresidencyvrindavan.in
 */
export const SITE_URL: string = (
  process.env.SITE_URL || "https://www.rkresidencyvrindavan.in"
).replace(/\/+$/, "");

/**
 * Runtime SEO guard: warn loudly if SITE_URL points to the legacy domain
 * (rkresidency.in) instead of the canonical production domain. This catches
 * a misconfigured Vercel env var before users and crawlers see wrong URLs.
 */
if (typeof SITE_URL === "string" && SITE_URL.includes("rkresidency.in") && !SITE_URL.includes("rkresidencyvrindavan.in")) {
  console.error(
    `[SEO] ⚠️ SITE_URL is set to "${SITE_URL}" which is the LEGACY domain.\n` +
    `  Every canonical, og:url, and sitemap URL will point to the wrong domain.\n` +
    `  Fix: Set SITE_URL=https://www.rkresidencyvrindavan.in in Vercel → Settings → Environment Variables.`
  );
}

/** Site name used across metadata. */
export const SITE_NAME = "RK Residency";

/** Default social share image (absolute URL built from SITE_URL). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero-vrindavan.webp`;

/**
 * Business contact data — TODO placeholders, to be filled by the owner.
 * These mirror the SiteSetting keys used by `useSettingValue()` so the admin
 * panel and this config stay conceptually in sync.
 */
export const BUSINESS = {
  /** Owner-supplied front-desk phone number in display format. */
  phonePrimary: "+91 9760814931",

  /** Same number in tel: format, no spaces. */
  phonePrimaryTel: "+919760814931",

  /** TODO: Reservations desk phone in display format (was placeholder "+91 98765 43210"). */
  phoneReservations: "",

  /** Owner-supplied WhatsApp number, country code + number, digits only. */
  whatsappNumber: "919760814931",

  /** Owner-supplied primary guest-facing email. */
  emailPrimary: "rkresiddency121@gmail.com",

  /** Owner-supplied GSTIN of the property, 15 chars. */
  gstin: "09GUJPS8343M1ZK",

  /**
   * Postal address — used by the footer, contact page and Hotel JSON-LD so the
   * SAME address appears everywhere. The property is in the Kailash Nagar
   * area; TODO: replace with the exact street/plot once confirmed.
   */
  address: {
    streetAddress: "Kailash Nagar", // TODO: exact street/plot (area: Kailash Nagar)
    addressLocality: "Vrindavan",
    addressRegion: "Uttar Pradesh",
    postalCode: "281121",
    addressCountry: "IN",
  },

  /** TODO: Exact geo coordinates of the hotel pin. Hotel JSON-LD omits `geo` until BOTH are filled. */
  geo: {
    latitude: "",
    longitude: "",
  },

  /** TODO: Confirm the real check-in / check-out times (currently the site's own claim). */
  checkinTime: "2:00 PM",
  checkoutTime: "11:00 AM",

  /**
   * Breakfast policy — SINGLE SOURCE OF TRUTH.
   * TODO(owner): the site currently contradicts itself (the trust badge and
   * FAQ say breakfast is INCLUDED in rates; the rooms note says EXCLUDED).
   * Set the ONE correct policy here and every page follows.
   */
  breakfastIncluded: true,

  /**
   * Founding year — SINGLE SOURCE OF TRUTH.
   * TODO(owner): the site currently contradicts itself (page says EST. 2024,
   * footer said "since 2014"). Set the ONE correct year here; the about
   * badge, footer line and "Years of Braj hospitality" counter all derive
   * from it.
   */
  establishedYear: 2024,

  /** TODO: Confirm this amenity list — currently mirrors the site's own copy (Trust badges + FAQ). */
  amenities: [
    "Free high-speed Wi-Fi",
    "Air conditioning",
    "24-hour hot water",
    "Power backup",
    "Rooftop satvik dining",
    "Wheelchair-accessible Heritage Wing",
  ],

  /**
   * AggregateRating for Hotel JSON-LD is emitted ONLY when BOTH a real,
   * verifiable rating value and review count are filled in here.
   * TODO: copy the exact rating + count shown on the Google Business Profile.
   */
  rating: {
    value: "", // e.g. "4.9"
    count: "", // e.g. "1240"
  },

  /**
   * Price range for Hotel JSON-LD. When empty, the homepage derives a real
   * range from the live room prices in the database instead.
   * TODO: leave empty to auto-derive, or set a fixed range e.g. "₹1,500 – ₹3,000".
   */
  priceRange: "",

  /**
   * "Starting from" price shown on the homepage rooms section and /rooms.
   * When empty, the site derives the real figure from the lowest room
   * basePrice in the database (no invented numbers).
   * TODO: leave empty to auto-derive, or set a fixed INR number e.g. 1500.
   */
  startingFromPrice: 0,

  /**
   * Distances from the hotel — SINGLE SOURCE OF TRUTH used by the homepage
   * "Distances from RK Residency" section, the contact page and the
   * experiences data, so every page shows the SAME figures.
   *
   * ⚠️ The pre-filled numbers mirror the claims ALREADY on the site (contact
   * page) — TODO: verify each one against Google Maps and correct here.
   * Empty km/time entries are omitted from the UI until filled in.
   */
  distances: {
    bankeBihari: { label: "Banke Bihari Mandir", km: "0.45", time: "6 min walk" }, // TODO: confirm
    iskcon: { label: "ISKCON Vrindavan", km: "1.2", time: "15 min walk" }, // TODO: confirm
    premMandir: { label: "Prem Mandir", km: "2.0", time: "25 min walk" }, // TODO: confirm
    shaniDevMandir: { label: "Shani Dev Mandir", km: "", time: "" }, // TODO: fill exact km + minutes
    keshiGhat: { label: "Keshi Ghat (Yamuna)", km: "0.65", time: "8 min walk" }, // TODO: confirm
    nidhivan: { label: "Nidhivan", km: "", time: "" }, // TODO: fill exact km + minutes
    railwayStation: { label: "Mathura Junction Railway Station", km: "12", time: "30 min drive" }, // TODO: confirm
    busStand: { label: "Vrindavan Bus Stand", km: "", time: "" }, // TODO: fill exact km + minutes
    agraAirport: { label: "Agra Airport", km: "65", time: "90 min drive" }, // TODO: confirm
  },

  social: {
    /** Owner-supplied Instagram profile URL. */
    instagram: "https://instagram.com/rkhotels_official",

    /** Owner-supplied Facebook page URL. */
    facebook: "https://facebook.com/profile.php?id=61579055787568",

    /** TODO: YouTube channel URL — owner has no channel yet; stays hidden until filled. */
    youtube: "",
  },

  reviews: {
    /** Owner-supplied Google listing URL (the maps.app.goo.gl share link). */
    google: "https://maps.app.goo.gl/EWLnPhdXAqbgmJ9Q6",

    /**
     * TODO: Google Place ID of the hotel — needed to fetch LIVE Google
     * reviews via the Places API (see src/lib/google-reviews.ts). The
     * GOOGLE_PLACES_API_KEY env var (owner creates in Google Cloud) is also
     * required. Until both exist the site shows owner-moderated guest
     * reviews from the database — nothing invented.
     */
    googlePlaceId: "",

    /** Owner-supplied TripAdvisor listing URL (real, verified by owner). */
    tripadvisor: "https://www.tripadvisor.in/Hotel_Review-g951350-d33536283-Reviews-Hotel_R_K_Residency-Vrindavan_Mathura_District_Uttar_Pradesh.html",
  },

  maps: {
    /**
     * TODO: Google Maps EMBED URL of the EXACT hotel pin — open Google Maps,
     * search the hotel, Share → "Embed a map", copy the iframe src="…" URL.
     * When empty, the site builds a no-key embed from BUSINESS.address.
     */
    embedUrl: "",

    /** Owner-supplied Google Maps place link (share URL) for "Get Directions". */
    directionsUrl: "https://maps.app.goo.gl/EWLnPhdXAqbgmJ9Q6",

    /** Owner-supplied Google Maps place link — the hotel's real Google listing. */
    googleBusinessProfile: "https://maps.app.goo.gl/EWLnPhdXAqbgmJ9Q6",
  },
} as const;

/**
 * The SAME address formatted for display everywhere (footer, contact page,
 * contact section, JSON-LD) so no page can drift from BUSINESS.address.
 * Update BUSINESS.address above and every surface follows.
 */
export function businessAddress() {
  const a = BUSINESS.address;
  return {
    /** "RK Residency, Kailash Nagar, Vrindavan" */
    line1: `RK Residency, ${a.streetAddress}`,
    /** "Vrindavan, Mathura" */
    line2: `${a.addressLocality}, Mathura`,
    /** "Uttar Pradesh 281121, India" */
    line3: `${a.addressRegion} ${a.postalCode}, India`,
    /** "RK Residency, Kailash Nagar, Vrindavan, Mathura, UP 281121" */
    full: `RK Residency, ${a.streetAddress}, ${a.addressLocality}, Mathura, UP ${a.postalCode}`,
  };
}
