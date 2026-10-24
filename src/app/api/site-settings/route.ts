import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/site-settings — public settings endpoint.
 *
 * ⚠️ SECURITY: this route is callable by ANYONE on the internet (curl
 * included). It therefore returns ONLY keys on an explicit public
 * whitelist. Payment gateway secrets (razorpay_key_secret,
 * razorpay_webhook_secret), email credentials (email_api_key) and any
 * WhatsApp gateway tokens are consumed server-side exclusively and must
 * NEVER appear in this response. The admin panel reads/edits the full
 * settings map through the auth-protected /api/admin/settings route.
 */
const PUBLIC_SETTING_KEYS = new Set([
  // Brand & SEO (already public on the page itself)
  "brand_name",
  "brand_tagline",
  "site_name",
  "site_tagline",
  "meta_title",
  "meta_description",
  "og_image_url",
  "favicon_url",
  "logo_image_url",
  "canonical_base_url",
  // Contact
  "phone_primary",
  "phone_primary_tel",
  "phone_reservations",
  "email_primary",
  "email_events",
  "email_from",
  "email_provider",
  "address_line1",
  "address_line2",
  "address_line3",
  "address_full",
  "gstin",
  // Maps & geo
  "geo_latitude",
  "geo_longitude",
  "map_embed_url",
  "map_directions_url",
  // Social & reviews
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "twitter_url",
  "tripadvisor_url",
  "google_reviews_url",
  // Analytics
  "ga_measurement_id",
  // WhatsApp (public business number — shown in the UI)
  "whatsapp_number",
  "whatsapp_enabled",
  // Hours & concierge
  "checkin_time",
  "checkout_time",
  "concierge_hours",
  "concierge_reply_window",
  // Payments — PUBLIC fields only (key_id is embedded in checkout.js by
  // design; key_secret and webhook_secret are NEVER exposed)
  "razorpay_enabled",
  "razorpay_mode",
  "razorpay_key_id",
]);

/** Defensive second layer: even if a secret key ever lands in the whitelist
 * above (or a future secret is added with a new name), these patterns keep
 * it private. */
const SECRET_PATTERN = /(_|^)(secret|password|token|credential|private)(_|$)|api_?key|key_secret|webhook_secret/i;

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({ select: { key: true, value: true } });
    const map: Record<string, string> = {};
    for (const s of settings) {
      if (!PUBLIC_SETTING_KEYS.has(s.key)) continue;
      if (SECRET_PATTERN.test(s.key)) continue;
      map[s.key] = s.value;
    }
    const res = NextResponse.json({ settings: map });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch {
    return NextResponse.json({ settings: {} });
  }
}
