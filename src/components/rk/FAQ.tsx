"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { useRouter } from "@/lib/router";
import { useContentValue, parseJsonArray } from "@/lib/site-content";
import { useSettingValue } from "@/lib/site-content";
import { sanitizeContactText, sanitizeWhatsapp } from "@/lib/use-contact-info";
import { BUSINESS } from "@/lib/site.config";
import { FAQS, type FAQ } from "@/lib/faq-data";

const CATEGORIES = ["All", "Booking", "Rooms", "Dining", "Temple Visits", "Accessibility"];

export function FAQ({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<number | null>(0);
  const [category, setCategory] = useState("All");
  const navigate = useRouter((s) => s.navigate);
  const faqLabel = useContentValue("faq.label", "Questions & answers");
  const faqTitle = useContentValue("faq.title", "Everything a Braj pilgrim asks us");
  const faqItems = parseJsonArray(useContentValue("faq.items", "[]"), FAQS);
  const phoneDisplay = sanitizeContactText(useSettingValue("phone_primary", BUSINESS.phonePrimary));
  const phoneTel = sanitizeContactText(useSettingValue("phone_primary_tel", BUSINESS.phonePrimaryTel));
  const whatsappNumber = sanitizeWhatsapp(useSettingValue("whatsapp_number", BUSINESS.whatsappNumber));
  const waUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";

  const filtered = category === "All" ? FAQS : FAQS.filter((f) => f.category === category);
  const visible = limit ? filtered.slice(0, limit) : filtered;

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
                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                      isOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    {/* NOTE: the answer is ALWAYS rendered in the DOM (crawlable
                        initial HTML for FAQ rich results); it is only visually
                        collapsed via max-height when closed. */}
                    <p className="px-5 pb-5 font-display text-sm leading-relaxed text-charcoal-soft">
                      {faq.a}
                    </p>
                  </div>
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
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-serif text-sm font-semibold text-white transition-all hover:shadow-lg"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp us
                  </a>
                )}
                {phoneTel && (
                  <a
                    href={`tel:${phoneTel}`}
                    className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-white px-5 py-2.5 font-serif text-sm font-semibold text-teal transition-all hover:bg-teal hover:text-ivory"
                  >
                    <Phone className="h-4 w-4" />
                    {phoneDisplay}
                  </a>
                )}
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
