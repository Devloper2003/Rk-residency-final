"use client";

import { useSettingValue, useContentValue } from "./site-content";
import { BUSINESS } from "./site.config";

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
  const phoneDisplay = useSettingValue("phone_primary", BUSINESS.phonePrimary);
  const phoneTel = useSettingValue("phone_primary_tel", BUSINESS.phonePrimaryTel);
  const phoneReservations = useSettingValue("phone_reservations", BUSINESS.phoneReservations);
  const emailPrimary = useSettingValue("email_primary", BUSINESS.emailPrimary);
  const emailEvents = useSettingValue("email_events", "");
  const addrLine1 = useSettingValue("address_line1", "RK Residency, Parikrama Marg");
  const addrLine2 = useSettingValue("address_line2", "Vrindavan, Mathura");
  const addrLine3 = useSettingValue("address_line3", "Uttar Pradesh 281121, India");
  const addressFull = useSettingValue("address_full", "RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121");
  const mapEmbedUrl = useSettingValue("map_embed_url", "https://www.openstreetmap.org/export/embed.html?bbox=77.6950%2C27.5650%2C77.7250%2C27.5850&layer=mapnik&marker=27.5756%2C77.7100");
  const mapDirectionsUrl = useSettingValue("map_directions_url", BUSINESS.maps.directionsUrl);
  const whatsappNumberRaw = useSettingValue("whatsapp_number", BUSINESS.whatsappNumber);
  const whatsappPrefill = useContentValue("contact.whatsapp_prefill_text", "I would like to enquire about availability at RK Residency");
  const checkinTime = useSettingValue("checkin_time", "2:00 PM");
  const checkoutTime = useSettingValue("checkout_time", "11:00 AM");
  const conciergeHours = useSettingValue("concierge_hours", "7 AM – 11 PM IST");
  const conciergeReplyWindow = useSettingValue("concierge_reply_window", "Replies in ~5 min");

  // Sanitize the WhatsApp number — strip +, spaces, dashes, parens so wa.me
  // accepts it. Admin might enter it as "+91 97608 14310" (display format)
  // but wa.me needs "919760814310".
  const whatsappNumber = whatsappNumberRaw.replace(/[^\d]/g, "");

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
    telUrl: `tel:${phoneTel}`,
    mailtoUrl: `mailto:${emailPrimary}`,
  };
}
