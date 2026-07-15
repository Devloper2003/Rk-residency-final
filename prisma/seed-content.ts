// Seed editable site content + settings
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const contentItems = [
  // Hero
  { key: "hero.location_badge", value: "Vrindavan · On the banks of the Yamuna", section: "hero", type: "text", label: "Location badge" },
  { key: "hero.headline_line1", value: "Where the spirit of Braj", section: "hero", type: "text", label: "Headline line 1" },
  { key: "hero.headline_line2", value: "finds its rest", section: "hero", type: "text", label: "Headline line 2" },
  { key: "hero.subheadline", value: "A heritage-luxury residency steps from Banke Bihari Mandir & ISKCON Vrindavan. Calm, dignified comfort for pilgrims, devotee families and cultural travellers.", section: "hero", type: "textarea", label: "Sub-headline" },
  { key: "hero.cta_primary", value: "Check Availability", section: "hero", type: "text", label: "Primary CTA" },
  { key: "hero.cta_secondary", value: "Explore Rooms", section: "hero", type: "text", label: "Secondary CTA" },
  { key: "hero.rating_text", value: "4.9 · 1,240+ verified stays", section: "hero", type: "text", label: "Rating text" },
  // Trust badges
  { key: "trust.badge1_title", value: "Best Price Guarantee", section: "trust", type: "text", label: "Badge 1 title" },
  { key: "trust.badge1_sub", value: "Direct booking, no OTA commission", section: "trust", type: "text", label: "Badge 1 subtitle" },
  { key: "trust.badge2_title", value: "Free Cancellation", section: "trust", type: "text", label: "Badge 2 title" },
  { key: "trust.badge2_sub", value: "Up to 72 hours before check-in", section: "trust", type: "text", label: "Badge 2 subtitle" },
  { key: "trust.badge3_title", value: "Late Check-out", section: "trust", type: "text", label: "Badge 3 title" },
  { key: "trust.badge3_sub", value: "Complimentary till 2 PM on request", section: "trust", type: "text", label: "Badge 3 subtitle" },
  { key: "trust.badge4_title", value: "Satvik Breakfast", section: "trust", type: "text", label: "Badge 4 title" },
  { key: "trust.badge4_sub", value: "Pure vegetarian, daily included", section: "trust", type: "text", label: "Badge 4 subtitle" },
  // About
  { key: "about.label", value: "Our Story", section: "about", type: "text", label: "Section label" },
  { key: "about.title_line1", value: "A heritage home on the", section: "about", type: "text", label: "Title line 1" },
  { key: "about.title_line2", value: "banks of the Yamuna", section: "about", type: "text", label: "Title line 2" },
  // Contact
  { key: "contact.phone", value: "+91 565 234 5678", section: "contact", type: "text", label: "Phone number" },
  { key: "contact.phone_reservations", value: "+91 98765 43210", section: "contact", type: "text", label: "Reservations phone" },
  { key: "contact.email", value: "stay@rkresidency.in", section: "contact", type: "text", label: "Email" },
  { key: "contact.email_events", value: "events@rkresidency.in", section: "contact", type: "text", label: "Events email" },
  { key: "contact.address_line1", value: "RK Residency, Parikrama Marg", section: "contact", type: "text", label: "Address line 1" },
  { key: "contact.address_line2", value: "Vrindavan, Mathura", section: "contact", type: "text", label: "Address line 2" },
  { key: "contact.address_line3", value: "Uttar Pradesh 281121, India", section: "contact", type: "text", label: "Address line 3" },
  // Footer
  { key: "footer.brand_name", value: "RK Residency", section: "footer", type: "text", label: "Brand name" },
  { key: "footer.brand_tagline", value: "Vrindavan · Braj", section: "footer", type: "text", label: "Brand tagline" },
  { key: "footer.description", value: "A heritage-luxury residency on the banks of the Yamuna, welcoming pilgrims and devotee families since 2014. A guest is a visiting deity.", section: "footer", type: "textarea", label: "Footer description" },
  { key: "footer.copyright", value: "© {year} RK Residency, Vrindavan. All rights reserved.", section: "footer", type: "text", label: "Copyright text" },
];

const settings = [
  { key: "ga_measurement_id", value: "", label: "Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)", category: "analytics" },
  { key: "whatsapp_number", value: "919876543210", label: "WhatsApp number (with country code, no +)", category: "contact" },
  { key: "instagram_url", value: "https://instagram.com", label: "Instagram URL", category: "social" },
  { key: "facebook_url", value: "https://facebook.com", label: "Facebook URL", category: "social" },
  { key: "youtube_url", value: "https://youtube.com", label: "YouTube URL", category: "social" },
  { key: "site_name", value: "RK Residency", label: "Site name", category: "general" },
  { key: "site_tagline", value: "Heritage Luxury Stay in Vrindavan", label: "Site tagline", category: "general" },
  { key: "checkin_time", value: "2:00 PM", label: "Check-in time", category: "general" },
  { key: "checkout_time", value: "11:00 AM", label: "Check-out time", category: "general" },
  { key: "gstin", value: "09AAACK1234R1Z5", label: "GSTIN", category: "general" },
];

async function main() {
  console.log("Seeding site content...");
  for (const item of contentItems) {
    await db.siteContent.upsert({
      where: { key: item.key },
      create: item,
      update: { value: item.value, label: item.label, section: item.section, type: item.type },
    });
  }
  console.log(`Seeded ${contentItems.length} content items`);

  console.log("Seeding site settings...");
  for (const s of settings) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { label: s.label, category: s.category },
    });
  }
  console.log(`Seeded ${settings.length} settings`);
}
main().catch(console.error).finally(() => db.$disconnect());
