"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { useRouter } from "@/lib/router";

type FAQ = {
  q: string;
  a: string;
  category: "Rooms" | "Dining" | "Booking" | "Temple Visits" | "Accessibility";
};

const FAQS: FAQ[] = [
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
    a: "Yes. Date changes are free up to 72 hours before check-in, subject to availability. Room upgrades are possible at check-in for the difference in rate. Contact our concierge at +91 565 234 5678 or stay@rkresidency.in to modify.",
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

const CATEGORIES = ["All", "Booking", "Rooms", "Dining", "Temple Visits", "Accessibility"];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [category, setCategory] = useState("All");
  const navigate = useRouter((s) => s.navigate);

  const visible = category === "All" ? FAQS : FAQS.filter((f) => f.category === category);

  return (
    <section id="faq" className="relative bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <HelpCircle className="h-4 w-4" />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Frequently Asked
              </span>
              <HelpCircle className="h-4 w-4" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Questions before you arrive
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl font-display text-sm leading-relaxed text-charcoal-soft sm:text-base">
              Everything from cancellation policies to satvik dining, temple darshan
              passes and accessibility. Can't find your answer? Write to us.
            </p>
          </Reveal>
        </div>

        {/* Category filter */}
        <Reveal delay={0.12}>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setOpen(null); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-ring ${
                  category === c
                    ? "border-teal bg-teal text-ivory"
                    : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40 hover:text-teal"
                }`}
                aria-pressed={category === c}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        {/* FAQ items */}
        <div className="space-y-3">
          {visible.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={`${faq.category}-${faq.q}`} delay={i * 0.04}>
                <div
                  className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                    isOpen ? "border-gold/40 shadow-md" : "border-charcoal/10 hover:border-teal/30"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left focus-ring"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1">
                      <span className="mb-1 inline-block rounded-full bg-marsala/8 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-marsala">
                        {faq.category}
                      </span>
                      <h3 className="font-serif text-base font-semibold text-charcoal sm:text-lg">
                        {faq.q}
                      </h3>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                        isOpen ? "bg-gold text-charcoal" : "bg-ivory-deep text-charcoal-soft"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 font-display text-sm leading-relaxed text-charcoal-soft">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Contact CTA */}
        <Reveal delay={0.15}>
          <div className="mt-12">
            <SectionDivider className="mb-8" />
            <div className="rounded-3xl border border-teal/20 bg-teal/5 p-6 text-center sm:p-8">
              <Lotus size={24} className="mx-auto mb-3 text-gold" />
              <h3 className="font-serif text-xl font-semibold text-charcoal sm:text-2xl">
                Still have a question?
              </h3>
              <p className="mx-auto mt-2 max-w-md font-display text-sm text-charcoal-soft">
                Our concierge team replies within 4 hours, 7 AM – 11 PM IST.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-serif text-sm font-semibold text-white transition-all hover:shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp us
                </a>
                <a
                  href="tel:+915652345678"
                  className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-white px-5 py-2.5 font-serif text-sm font-semibold text-teal transition-all hover:bg-teal hover:text-ivory"
                >
                  <Phone className="h-4 w-4" />
                  +91 565 234 5678
                </a>
                <button
                  onClick={() => navigate("contact")}
                  className="inline-flex items-center gap-2 rounded-full border border-marsala/40 bg-white px-5 py-2.5 font-serif text-sm font-semibold text-marsala transition-all hover:bg-marsala hover:text-ivory"
                >
                  <Mail className="h-4 w-4" />
                  Send a message
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
