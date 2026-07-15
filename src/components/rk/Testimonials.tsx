"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote, ExternalLink } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";

type Review = {
  id: string;
  guestName: string;
  guestLocation: string | null;
  rating: number;
  title: string;
  body: string;
  source: "DIRECT" | "GOOGLE" | "TRIPADVISOR";
  verified: boolean;
};

const SOURCE_LABEL: Record<Review["source"], string> = {
  DIRECT: "RK Residency",
  GOOGLE: "Google Reviews",
  TRIPADVISOR: "TripAdvisor",
};

const SOURCE_COLOR: Record<Review["source"], string> = {
  DIRECT: "bg-teal/10 text-teal",
  GOOGLE: "bg-marsala/10 text-marsala",
  TRIPADVISOR: "bg-gold/15 text-gold-deep",
};

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="mx-3 w-[320px] shrink-0 rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:w-[380px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"
              }`}
            />
          ))}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${SOURCE_COLOR[r.source]}`}
        >
          {SOURCE_LABEL[r.source]}
        </span>
      </div>
      <Quote className="h-6 w-6 text-gold/40" />
      <h4 className="mt-2 font-serif text-lg font-semibold text-charcoal">{r.title}</h4>
      <p className="mt-2 font-display text-sm leading-relaxed text-charcoal-soft">
        {r.body}
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-charcoal/10 pt-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-teal/10 font-serif text-base font-semibold text-teal">
          {r.guestName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-sm font-semibold text-charcoal">
              {r.guestName}
            </span>
            {r.verified && (
              <BadgeCheck className="h-4 w-4 text-teal" aria-label="Verified stay" />
            )}
          </div>
          <div className="font-display text-xs text-charcoal-soft">
            {r.guestLocation || "Verified guest"}
            {r.verified && " · Verified stay"}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Duplicate for infinite marquee
  const doubled = [...reviews, ...reviews];

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-teal py-24 text-ivory lg:py-32"
    >
      {/* Yamuna ripple bg */}
      <div className="bg-yamuna-ripple pointer-events-none absolute inset-0 opacity-25" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-soft">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Guest Voices
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              From our devotee guests
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                <span className="font-serif text-2xl font-bold">4.9</span>
                <span className="font-display text-sm text-ivory/70">/ 5</span>
              </div>
              <div className="hidden h-8 w-px bg-ivory/30 sm:block" />
              <div className="font-display text-sm text-ivory/80">
                Aggregated from{" "}
                <span className="font-semibold text-gold-soft">Google</span>,{" "}
                <span className="font-semibold text-gold-soft">TripAdvisor</span> &amp; direct stays
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Marquee */}
      {!loading && reviews.length > 0 ? (
        <div className="relative">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-teal to-transparent sm:w-40" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-teal to-transparent sm:w-40" />

          <div className="flex w-max animate-[marquee_48s_linear_infinite] gap-0 will-change-transform hover:[animation-play-state:paused]">
            {doubled.map((r, i) => (
              <ReviewCard key={`${r.id}-${i}`} r={r} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-7xl gap-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 w-80 shrink-0 animate-pulse rounded-3xl bg-ivory/10" />
          ))}
        </div>
      )}

      {/* Aggregate badges */}
      <div className="relative mt-16">
        <SectionDivider className="mb-8" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 sm:flex-row sm:gap-12">
          <a
            href="https://www.google.com/travel/hotels"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-ivory/15 bg-ivory/5 px-5 py-3 transition-all hover:border-gold/40 hover:bg-ivory/10"
          >
            <div className="font-serif text-2xl font-bold text-gold-soft">4.9</div>
            <div>
              <div className="font-display text-xs uppercase tracking-wider text-ivory/70">
                Google Reviews
              </div>
              <div className="flex items-center gap-1.5 font-display text-xs text-ivory/85">
                840+ reviews
                <ExternalLink className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </a>
          <a
            href="https://www.tripadvisor.in"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-ivory/15 bg-ivory/5 px-5 py-3 transition-all hover:border-gold/40 hover:bg-ivory/10"
          >
            <div className="font-serif text-2xl font-bold text-gold-soft">4.8</div>
            <div>
              <div className="font-display text-xs uppercase tracking-wider text-ivory/70">
                TripAdvisor
              </div>
              <div className="flex items-center gap-1.5 font-display text-xs text-ivory/85">
                400+ reviews · Travellers' Choice 2025
                <ExternalLink className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
