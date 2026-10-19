/**
 * faq-data.ts — SINGLE SOURCE OF TRUTH for the site's FAQ content.
 *
 * Used by BOTH:
 *   - the <FAQ /> section component (rendering), and
 *   - the FAQPage JSON-LD builder on the server (structured data),
 * so the questions/answers in the markup always match the schema.
 *
 * No "use client" — this module is server-safe and client-safe.
 */
import { BUSINESS } from "./site.config";

// Owner-supplied contact details for the FAQ copy — TODO placeholders from
// site.config; omitted gracefully from the sentence when not yet filled in.
const FAQ_CONTACT_TAIL =
  BUSINESS.phonePrimary || BUSINESS.emailPrimary
    ? ` Contact our concierge${BUSINESS.phonePrimary ? ` at ${BUSINESS.phonePrimary}` : ""}${BUSINESS.phonePrimary && BUSINESS.emailPrimary ? " or" : ""}${BUSINESS.emailPrimary ? ` ${BUSINESS.emailPrimary}` : ""} to modify.`
    : " Contact our concierge to modify.";

export type FAQ = {
  q: string;
  a: string;
  category: "Rooms" | "Dining" | "Booking" | "Temple Visits" | "Accessibility";
};

export const FAQS: FAQ[] = [
  {
    category: "Booking",
    q: "What is your cancellation policy?",
    a: "Free cancellation up to 72 hours before check-in. Cancellations within 72 hours forfeit one night's charge. Festival periods (Janmashtami, Holi, Radhashtami) have a 7-day cancellation window. Refunds are processed within 5–7 business days to the original payment method.",
  },
  {
    category: "Booking",
    q: "Do I need to pay a deposit or full amount at booking?",
    a: "For Pay-at-Hotel bookings, no deposit is required — we hold a valid card on file. For Razorpay/Stripe bookings, the full amount is charged at confirmation. All rates include 12% GST and a ₹250/night service fee — no hidden charges.",
  },
  {
    category: "Booking",
    q: "Can I modify my booking after confirmation?",
    a: "Yes. Date changes are free up to 72 hours before check-in, subject to availability. Room upgrades are possible at check-in for the difference in rate." + FAQ_CONTACT_TAIL,
  },
  {
    category: "Rooms",
    q: "What time is check-in and check-out?",
    a: "Check-in is from 2:00 PM. Check-out is by 11:00 AM. Early check-in (from 10 AM) is complimentary subject to availability — please request at booking. Late check-out till 2 PM is available on request at no extra charge.",
  },
  {
    category: "Rooms",
    q: "Is Wi-Fi available? Is it reliable?",
    a: "Yes, complimentary high-speed Wi-Fi is available in all rooms and public areas. Speeds typically range 20–50 Mbps. However, Vrindavan's internet infrastructure can be intermittent during festival periods when the town's population surges — we recommend downloading important content beforehand.",
  },
  {
    category: "Rooms",
    q: "Do you have air conditioning and hot water?",
    a: "Yes, all rooms have individually controlled air conditioning and 24-hour hot water. Power backup (generator) ensures uninterrupted supply during the occasional grid outages that affect Vrindavan.",
  },
  {
    category: "Dining",
    q: "Is the food pure vegetarian? Can you accommodate vegan/Jain diets?",
    a: "Yes, our kitchen is strictly satvik — no onion, no garlic, no eggs, no meat. Vegan options are available on request (replace dairy with plant-based alternatives). Jain-style cooking (no root vegetables) is also available. Please mention dietary requirements at booking.",
  },
  {
    category: "Dining",
    q: "Is breakfast included in the room rate?",
    a: "Yes, daily satvik breakfast is included for all guests. It is served from 7:00 AM to 10:30 AM in the rooftop Yamuna Pavilion or in your room. The breakfast menu includes puri-sabzi, parathas, fruit thali, and makhan mishri prasadam.",
  },
  {
    category: "Dining",
    q: "Can you prepare food for fasting days (vrat/Ekadashi)?",
    a: "Absolutely. Our chef prepares special farali (vrat) menus for Ekadashi, Janmashtami and other fasting days — sabudana khichdi, rajgira puri, farali cheela, and fruit plates. Please inform us 24 hours in advance.",
  },
  {
    category: "Temple Visits",
    q: "Can you arrange darshan passes for Banke Bihari and ISKCON?",
    a: "Yes. Our concierge arranges reserved VIP darshan passes for Banke Bihari Mandir (skips the general queue) and ISKCON. We need 24 hours' notice. Passes are complimentary for stays of 2+ nights; otherwise a nominal fee of ₹500 per pass applies.",
  },
  {
    category: "Temple Visits",
    q: "What is the best time to visit Vrindavan?",
    a: "October–March is peak season with pleasant weather (8–22°C). Janmashtami (Aug/Sep) and Holi (Feb/Mar) are the busiest festival windows. April–June is hot but quieter with lower rates. July–September is monsoon — the Yamuna swells and the aarti is especially moving.",
  },
  {
    category: "Temple Visits",
    q: "Do you arrange guided temple tours?",
    a: "Yes. We offer a private air-conditioned temple circuit (₹2,500/day, covers all major temples) and a guided walking yatra with a resident Vrindavan scholar (₹1,200/session, 2–3 hours). English-speaking guides available. Book at check-in or through the concierge desk.",
  },
  {
    category: "Accessibility",
    q: "Is the property wheelchair accessible?",
    a: "The Heritage Wing (ground floor) and the rooftop dining pavilion are wheelchair accessible via ramps. Two rooms (one in Banke Bihari Deluxe, one in Radha Rani Junior Suite) have roll-in showers. The Heritage Wing's upper floors are accessible by stairs only. Please mention accessibility needs at booking.",
  },
  {
    category: "Accessibility",
    q: "Are children welcome? Do you have cribs?",
    a: "Absolutely. RK Residency is a multi-generational pilgrimage property — children are always welcome. Children under 6 stay free with existing bedding. Cribs, roll-away beds and a kids' satvik menu are available on request at no charge. Babysitting can be arranged for ₹300/hour.",
  },
  {
    category: "Accessibility",
    q: "Is smoking or alcohol allowed?",
    a: "RK Residency is a strictly vegetarian, satvik property. Smoking is not permitted anywhere on the premises. Alcohol is not served or permitted on the property, in keeping with the spiritual character of Vrindavan. Designated smoking areas are available outside the main gate.",
  },
];
