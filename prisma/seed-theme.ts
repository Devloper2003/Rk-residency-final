// Seed theme settings + expand site content for all pages
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const themeSettings = [
  { key: "primary_color", value: "#0E4C4F", label: "Primary Color (Peacock Teal)" },
  { key: "accent_color", value: "#C7A250", label: "Accent Color (Temple Gold)" },
  { key: "secondary_color", value: "#6E1E36", label: "Secondary Color (Marsala Maroon)" },
  { key: "background_color", value: "#FBF6EC", label: "Background Color (Warm Ivory)" },
  { key: "text_color", value: "#231F1C", label: "Text Color (Charcoal)" },
];

// Additional content items for more pages
const additionalContent = [
  // Rooms page
  { key: "rooms.title", value: "Rooms, suites & a private villa", section: "rooms", type: "text", label: "Page title" },
  { key: "rooms.subtitle", value: "Each room is individually designed with hand-carved teak, Makrana marble and Braj-region textiles.", section: "rooms", type: "textarea", label: "Page subtitle" },
  // Experiences page
  { key: "experiences.title", value: "The Braj yatra, curated for you", section: "experiences", type: "text", label: "Page title" },
  { key: "experiences.subtitle", value: "Five sacred sites within a 25-minute walk of RK Residency.", section: "experiences", type: "textarea", label: "Page subtitle" },
  // Dining page
  { key: "dining.title", value: "Food as prasadam, not just sustenance", section: "dining", type: "text", label: "Page title" },
  { key: "dining.subtitle", value: "Our kitchen follows the strict satvik tradition of Braj — no onion, no garlic, no eggs.", section: "dining", type: "textarea", label: "Page subtitle" },
  // Gallery page
  { key: "gallery.title", value: "A glimpse of Braj", section: "gallery", type: "text", label: "Page title" },
  { key: "gallery.subtitle", value: "Step inside RK Residency — heritage interiors, the Yamuna ghats, temple rituals.", section: "gallery", type: "textarea", label: "Page subtitle" },
  // Offers page
  { key: "offers.title", value: "Sacred seasons, thoughtfully packaged", section: "offers", type: "text", label: "Page title" },
  { key: "offers.subtitle", value: "From the midnight abhishek of Janmashtami to the colours of Holi in Barsana.", section: "offers", type: "textarea", label: "Page subtitle" },
  // Blog page
  { key: "blog.title", value: "The Braj Journal", section: "blog", type: "text", label: "Page title" },
  { key: "blog.subtitle", value: "Temple guides, festival calendars, local tips and stories from Vrindavan.", section: "blog", type: "textarea", label: "Page subtitle" },
  // About page
  { key: "about.subtitle", value: "RK Residency began as the Khandelwal family home — a household that for three generations hosted every visiting sadhu, kirtaniya and pilgrim family that knocked on its door.", section: "about", type: "textarea", label: "About subtitle" },
  // Contact page
  { key: "contact.title", value: "Begin your Braj journey", section: "contact", type: "text", label: "Page title" },
  { key: "contact.subtitle", value: "Whether you are planning a pilgrimage, a satsang retreat or a small wedding — write to us. Our concierge replies within four hours.", section: "contact", type: "textarea", label: "Page subtitle" },
  // Festivals
  { key: "festivals.title", value: "Sacred seasons of Braj", section: "festivals", type: "text", label: "Page title" },
  { key: "festivals.subtitle", value: "Vrindavan's spiritual calendar shapes everything — the crowds, the mood, the rates, the darshan.", section: "festivals", type: "textarea", label: "Page subtitle" },
];

async function main() {
  console.log("Seeding theme settings...");
  for (const t of themeSettings) {
    await db.themeSetting.upsert({
      where: { key: t.key },
      create: t,
      update: { label: t.label },
    });
  }
  console.log(`Seeded ${themeSettings.length} theme settings`);

  console.log("Seeding additional content items...");
  for (const c of additionalContent) {
    await db.siteContent.upsert({
      where: { key: c.key },
      create: c,
      update: { value: c.value, label: c.label, section: c.section, type: c.type },
    });
  }
  console.log(`Seeded ${additionalContent.length} additional content items`);
}
main().catch(console.error).finally(() => db.$disconnect());
