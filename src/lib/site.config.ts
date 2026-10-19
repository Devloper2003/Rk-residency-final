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
