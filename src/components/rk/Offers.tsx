"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Calendar, Check, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Lotus, SectionDivider } from "./Motifs";

type Offer = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  perks: string; // JSON array
  discountPct: number | null;
  validFrom: string;
  validUntil: string;
  imageUrl: string | null;
  badge: string | null;
};

export function Offers({ onBookClick }: { onBookClick: () => void }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="offers" className="relative bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Offers &amp; Packages
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              Sacred seasons,
              <br />
              <span className="text-marsala italic">thoughtfully packaged</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              From the midnight abhishek of Janmashtami to the colours of Holi in
              Barsana — our festival packages are designed around the real Braj
              calendar, not generic hotel promotions.
            </p>
          </Reveal>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[460px] animate-pulse rounded-3xl bg-charcoal/5" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o, i) => {
              const perks: string[] = JSON.parse(o.perks || "[]");
              const validUntil = new Date(o.validUntil);
              const now = new Date();
              const daysLeft = Math.max(
                0,
                Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              );
              return (
                <motion.article
                  key={o.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px 0px" }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border shadow-lg transition-all hover:shadow-2xl ${
                    i === 0
                      ? "border-gold/40 bg-charcoal text-ivory md:col-span-2 lg:col-span-1"
                      : "border-charcoal/10 bg-white text-charcoal"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={o.imageUrl || "/images/marigold-garland.jpg"}
                      alt={o.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
                    {/* Badge */}
                    {o.badge && (
                      <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-marsala/85 px-3 py-1 text-xs font-semibold text-ivory backdrop-blur-sm">
                        <Tag className="mr-1 inline h-3 w-3" />
                        {o.badge}
                      </div>
                    )}
                    {/* Discount */}
                    {o.discountPct && (
                      <div className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-charcoal">
                        {o.discountPct}% OFF
                      </div>
                    )}
                    {/* Title overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="font-serif text-xl font-semibold text-ivory">
                        {o.title}
                      </h3>
                      <p className="font-display text-sm text-gold-soft">{o.tagline}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-4 font-display text-sm leading-relaxed text-charcoal-soft">
                      {o.description}
                    </p>

                    {/* Perks */}
                    <ul className="mb-5 space-y-2">
                      {perks.slice(0, 4).map((p) => (
                        <li
                          key={p}
                          className={`flex items-start gap-2 text-sm ${
                            i === 0 ? "text-ivory/85" : "text-charcoal-soft"
                          }`}
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              i === 0 ? "text-gold-soft" : "text-teal"
                            }`}
                          />
                          {p}
                        </li>
                      ))}
                    </ul>

                    {/* Validity + CTA */}
                    <div className="mt-auto flex items-center justify-between border-t border-current/10 pt-4">
                      <div
                        className={`flex items-center gap-1.5 text-xs ${
                          i === 0 ? "text-ivory/70" : "text-charcoal-soft"
                        }`}
                      >
                        {daysLeft > 0 ? (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{daysLeft} days left</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Year-round</span>
                          </>
                        )}
                      </div>
                      <Button
                        onClick={onBookClick}
                        className={`group/btn rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                          i === 0
                            ? "bg-gold text-charcoal hover:bg-gold-deep hover:text-ivory"
                            : "bg-teal text-ivory hover:bg-teal-deep"
                        }`}
                      >
                        Reserve
                        <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-12">
            <SectionDivider className="mb-6" />
            <p className="text-center font-display text-sm text-charcoal-soft">
              All packages include daily satvik breakfast, complimentary Wi-Fi &amp;
              concierge assistance. Rates are per room, inclusive of 12% GST.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
