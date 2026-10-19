"use client";

import { useSettingValue, useContentValue } from "./site-content";
import { BUSINESS, businessAddress } from "./site.config";

/**
 * Google Maps embed (no API key needed) built from the address in
 * site.config. Replaces the old OpenStreetMap iframe. When the owner fills
 * BUSINESS.maps.embedUrl with the exact-place embed URL, that wins.
 */
export function googleMapsEmbedUrl() {
  return (
    BUSINESS.maps.embedUrl ||
    `https://www.google.com/maps?q=${encodeURIComponent(businessAddress().full)}&output=embed`
  );
}

/**
 * Google Maps directions link to the REAL business address (Kailash Nagar,
 * Vrindavan). Used as the fallback for every "Get directions" button so the
 * button always points somewhere real — never a bare "#".
 * When the owner claims their Google Business Profile, they can paste the
 * exact place link into the `map_directions_url` setting (Admin → Settings)
 * and that wins.
 */
export function googleMapsDirectionsUrl() {
  return (
    BUSINESS.maps.directionsUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(businessAddress().full)}`
  );
}

/**
 * Known PLACEHOLDER contact values that were seeded into old databases.
 * They must NEVER render on the public site even if a legacy DB row still
 * carries them — real details come only from the owner via Admin → Settings.
 * (scripts/clear-placeholder-contact.ts clears these rows too; this guard
 * covers databases that have not run the script yet.)
 */
const PLACEHOLDER_NUMBERS = new Set(["919876543210"]);
const PLACEHOLDER_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Vrindavan%20Uttar%20Pradesh";

/** WhatsApp digits for wa.me — "" when empty or a known placeholder. */
export function sanitizeWhatsapp(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/[^\d]/g, "");
  if (!digits || PLACEHOLDER_NUMBERS.has(digits)) return "";
  return digits;
}

/** Display phone/email text — "" when empty or a known placeholder. */
export function sanitizeContactText(raw: string | null | undefined): string {
  const v = (raw || "").trim();
  if (!v) return "";
  if (PLACEHOLDER_NUMBERS.has(v.replace(/[^\d]/g, ""))) return "";
  return v;
}

/** Directions URL — placeholder/generic seeds fall back to the real address. */
export function sanitizeDirectionsUrl(raw: string | null | undefined): string {
  const v = (raw || "").trim();
  if (!v || v === PLACEHOLDER_DIRECTIONS_URL) return googleMapsDirectionsUrl();
  return v;
}

/**
 * Social profile URLs — generic homepage placeholders (e.g. bare
 * "https://instagram.com") are treated as empty so the icon hides instead
 * of linking to a page that is not the hotel's profile.
 */
const PLACEHOLDER_SOCIAL_URLS = new Set([
  "https://instagram.com",
  "https://www.instagram.com",
  "https://facebook.com",
  "https://www.facebook.com",
  "https://youtube.com",
  "https://www.youtube.com",
]);

export function sanitizeSocialUrl(raw: string | null | undefined): string {
  const v = (raw || "").trim().replace(/\/+$/, ""); // strip trailing slashes
  if (!v || PLACEHOLDER_SOCIAL_URLS.has(v)) return "";
  return v;
}

/**
 * Shared hook that returns all the live contact info used across multiple
 * page components (ContactPage, RoomDetailPage, ExperiencesPages, OffersPages,
 * BlogPages, GalleryPage, FAQ, etc.). Each consumer reads the same settings
 * so a single update in admin propagates everywhere instantly.
 */
export function useContactInfo() {
  // Fallbacks come from src/lib/site.config.ts BUSINESS block — TODO values
  // filled by the owner. The DB setting (Admin → Settings) always wins when
  // present; when absent we render empty rather than inventing dummy data.
  // Everything passes through the placeholder sanitizers below so legacy
  // dummy values (e.g. the old sample WhatsApp number) can never render.
  const phoneDisplay = sanitizeContactText(useSettingValue("phone_primary", BUSINESS.phonePrimary));
  const phoneTel = sanitizeContactText(useSettingValue("phone_primary_tel", BUSINESS.phonePrimaryTel));
  const phoneReservations = sanitizeContactText(useSettingValue("phone_reservations", BUSINESS.phoneReservations));
  const emailPrimary = sanitizeContactText(useSettingValue("email_primary", BUSINESS.emailPrimary));
  const emailEvents = sanitizeContactText(useSettingValue("email_events", ""));
  // Address comes from BUSINESS.address (single source of truth) so the
  // header, footer, contact page and Hotel JSON-LD all show the SAME one.
  const addr = businessAddress();
  const addrLine1 = useSettingValue("address_line1", addr.line1);
  const addrLine2 = useSettingValue("address_line2", addr.line2);
  const addrLine3 = useSettingValue("address_line3", addr.line3);
  const addressFull = useSettingValue("address_full", addr.full);
  const mapEmbedUrl = useSettingValue("map_embed_url", googleMapsEmbedUrl());
  const mapDirectionsUrl = sanitizeDirectionsUrl(useSettingValue("map_directions_url", ""));
  const whatsappNumberRaw = useSettingValue("whatsapp_number", BUSINESS.whatsappNumber);
  const whatsappPrefill = useContentValue("contact.whatsapp_prefill_text", "I would like to enquire about availability at RK Residency");
  const checkinTime = useSettingValue("checkin_time", "2:00 PM");
  const checkoutTime = useSettingValue("checkout_time", "11:00 AM");
  const conciergeHours = useSettingValue("concierge_hours", "7 AM – 11 PM IST");
  const conciergeReplyWindow = useSettingValue("concierge_reply_window", "Replies in ~5 min");

  // Sanitize the WhatsApp number — strip +, spaces, dashes, parens so wa.me
  // accepts it. Admin might enter it as "+91 97608 14310" (display format)
  // but wa.me needs "919760814310". Placeholder numbers become "".
  const whatsappNumber = sanitizeWhatsapp(whatsappNumberRaw);

  const waUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappPrefill)}`
    : "";
  const waUrlPlain = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";

  return {
    phoneDisplay,
    phoneTel,
    phoneReservations,
    emailPrimary,
    emailEvents,
    addrLine1,
    addrLine2,
    addrLine3,
    addressFull,
    mapEmbedUrl,
    mapDirectionsUrl,
    whatsappNumber,
    whatsappPrefill,
    checkinTime,
    checkoutTime,
    conciergeHours,
    conciergeReplyWindow,
    waUrl,
    waUrlPlain,
    telUrl: phoneTel ? `tel:${phoneTel}` : "",
    mailtoUrl: emailPrimary ? `mailto:${emailPrimary}` : "",
  };
}
