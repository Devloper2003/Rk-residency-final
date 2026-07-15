"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Calendar, Check, Clock, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { PageShell } from "../PageShell";
import { Button } from "@/components/ui/button";
import { Reveal, Lotus } from "../Motifs";
import { useRouter } from "@/lib/router";

type Offer = {
  id: string; slug: string; title: string; tagline: string; description: string;
  perks: string; discountPct: number | null; validFrom: string; validUntil: string;
  imageUrl: string | null; badge: string | null; featured: boolean;
};

export function OffersListPage({ onBookClick }: { onBookClick?: () => void }) {
  const navigate = useRouter((s) => s.navigate);
  const openBooking = useRouter((s) => s.openBooking);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else openBooking();
  };

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || []);
        setLoading(false);
      });
  }, []);

  return (
    <PageShell
      title="Sacred seasons, thoughtfully packaged"
      subtitle="From the midnight abhishek of Janmashtami to the colours of Holi in Barsana — our festival packages are designed around the real Braj calendar, not generic hotel promotions."
      accent="gold"
    >
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <motion.button
                key={o.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                onClick={() => navigate("offer-detail", o.slug)}
                className={`group flex flex-col overflow-hidden rounded-3xl border shadow-lg transition-all hover:shadow-2xl text-left ${
                  i === 0
                    ? "border-gold/40 bg-charcoal text-ivory md:col-span-2 lg:col-span-1"
                    : "border-charcoal/10 bg-white text-charcoal"
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={o.imageUrl || "/images/marigold-garland.jpg"}
                    alt={o.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
                  {o.badge && (
                    <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-marsala/85 px-3 py-1 text-xs font-semibold text-ivory backdrop-blur-sm">
                      <Tag className="mr-1 inline h-3 w-3" />
                      {o.badge}
                    </div>
                  )}
                  {o.discountPct && (
                    <div className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-charcoal">
                      {o.discountPct}% OFF
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-serif text-xl font-semibold text-ivory">{o.title}</h3>
                    <p className="font-display text-sm text-gold-soft">{o.tagline}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="mb-4 line-clamp-2 font-display text-sm text-charcoal-soft">
                    {o.description}
                  </p>
                  <ul className="mb-5 space-y-2">
                    {perks.slice(0, 3).map((p) => (
                      <li key={p} className={`flex items-start gap-2 text-sm ${i === 0 ? "text-ivory/85" : "text-charcoal-soft"}`}>
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${i === 0 ? "text-gold-soft" : "text-teal"}`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between border-t border-current/10 pt-4">
                    <div className={`flex items-center gap-1.5 text-xs ${i === 0 ? "text-ivory/70" : "text-charcoal-soft"}`}>
                      {daysLeft > 0 ? (
                        <><Clock className="h-3.5 w-3.5" /><span>{daysLeft} days left</span></>
                      ) : (
                        <><Calendar className="h-3.5 w-3.5" /><span>Year-round</span></>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-teal">
                      View package
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export function OfferDetailPage({ slug, onBookClick }: { slug: string; onBookClick?: () => void }) {
  const navigate = useRouter((s) => s.navigate);
  const openBooking = useRouter((s) => s.openBooking);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else openBooking();
  };

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        setOffer((data.offers as Offer[]).find((o) => o.slug === slug) || null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      </div>
    );
  }
  if (!offer) {
    return (
      <PageShell title="Package not found">
        <Button onClick={() => navigate("offers")}>All packages</Button>
      </PageShell>
    );
  }

  const perks: string[] = JSON.parse(offer.perks || "[]");
  const validUntil = new Date(offer.validUntil);
  const validFrom = new Date(offer.validFrom);
  const daysLeft = Math.max(
    0,
    Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <PageShell title={offer.title} subtitle={offer.tagline} accent="gold">
      {/* Hero */}
      <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
        <img
          src={offer.imageUrl || "/images/marigold-garland.jpg"}
          alt={offer.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
        {offer.badge && (
          <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-marsala/85 px-4 py-1.5 text-sm font-semibold text-ivory backdrop-blur-sm">
            <Tag className="mr-1.5 inline h-4 w-4" />
            {offer.badge}
          </div>
        )}
        {offer.discountPct && (
          <div className="absolute right-4 top-4 rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-charcoal">
            {offer.discountPct}% OFF
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
          <div className="font-display text-xs uppercase tracking-wider text-gold-soft">
            Valid {validFrom.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" → "}
            {validUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Left */}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-charcoal">About this package</h2>
          <p className="mt-4 font-display text-base leading-relaxed text-charcoal-soft">
            {offer.description}
          </p>

          <h3 className="mt-10 font-serif text-xl font-semibold text-charcoal">What’s included</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl border border-charcoal/10 bg-white p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/8 text-teal">
                  <Check className="h-4 w-4" />
                </span>
                <span className="font-display text-sm text-charcoal-soft">{p}</span>
              </li>
            ))}
          </ul>

          {/* Countdown */}
          {daysLeft > 0 && daysLeft < 60 && (
            <div className="mt-8 rounded-2xl border border-marsala/30 bg-marsala/5 p-5 text-center">
              <div className="font-display text-xs uppercase tracking-wider text-marsala">
                Time-sensitive package
              </div>
              <div className="mt-1 font-serif text-3xl font-bold text-marsala">
                {daysLeft} days left
              </div>
              <div className="font-display text-xs text-charcoal-soft">
                Until {validUntil.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          )}
        </div>

        {/* Right: book card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-xl">
            {offer.discountPct && (
              <div className="mb-3 inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-deep">
                Save {offer.discountPct}%
              </div>
            )}
            <div className="font-display text-xs uppercase tracking-wider text-charcoal-soft">
              Reserve this package
            </div>
            <p className="mt-2 font-display text-sm text-charcoal-soft">
              Click below to check availability for this package. Our concierge
              will confirm festival permissions and temple-access passes within
              4 hours.
            </p>
            <Button
              onClick={handleBook}
              className="cta-glow mt-5 w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3 font-serif text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Reserve this package
            </Button>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-full border border-[#25D366]/40 bg-[#25D366]/5 py-2.5 text-center font-display text-xs font-semibold text-[#1a7d3a] transition-colors hover:bg-[#25D366]/10"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <button
          onClick={() => navigate("offers")}
          className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-4 py-2 font-display text-sm font-semibold text-charcoal-soft transition-all hover:border-teal hover:bg-teal hover:text-ivory"
        >
          <ArrowLeft className="h-4 w-4" />
          All packages
        </button>
      </div>
    </PageShell>
  );
}
