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
  /** TODO: Real primary/front-desk phone number in display format (was placeholder "+91 565 234 5678"). */
  phonePrimary: "",

  /** TODO: Same number in tel: format, no spaces (was placeholder "+915652345678"). */
  phonePrimaryTel: "",

  /** TODO: Reservations desk phone in display format (was placeholder "+91 98765 43210"). */
  phoneReservations: "",

  /** TODO: WhatsApp number, country code + number, digits only (was placeholder "919876543210"). */
  whatsappNumber: "",

  /** TODO: Primary guest-facing email (was placeholder "stay@rkresidency.in"). */
  emailPrimary: "",

  /** TODO: Real GSTIN of the property, 15 chars, e.g. "09ABCDE1234F1Z5" (was placeholder "09AAACK1234R1Z5"). */
  gstin: "",

  /**
   * Postal address — used by the footer, contact page and Hotel JSON-LD so the
   * SAME address appears everywhere. The property is in the Kailash Nagar
   * area; TODO: replace with the exact street/plot once confirmed.
   */
  address: {
    streetAddress: "Kailash Nagar, Vrindavan", // TODO: exact street/plot
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
    /** TODO: Real Instagram profile URL (was placeholder "https://instagram.com"). */
    instagram: "",

    /** TODO: Real Facebook page URL (was placeholder "https://facebook.com"). */
    facebook: "",

    /** TODO: Real YouTube channel URL (was placeholder "https://youtube.com"). */
    youtube: "",
  },

  reviews: {
    /** TODO: Google Business Profile "Write a review" / listing URL for the hotel. */
    google: "",

    /** TODO: TripAdvisor listing URL for the hotel (was placeholder "https://www.tripadvisor.in"). */
    tripadvisor: "",
  },

  maps: {
    /** TODO: Google Maps place URL (share link) of the hotel for "Get Directions". */
    directionsUrl: "",
  },
} as const;
