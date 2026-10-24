import { useEffect, useState } from "react";

import { useContentValue } from "@/lib/site-content";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote, ExternalLink } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { BUSINESS } from "@/lib/site.config";
import type { GoogleReviewsData } from "@/lib/google-reviews";

export type Review = {
  id: string;
  guestName: string;
  guestLocation: string | null;
  rating: number;
  title: string;
  body: string;
  source: string; // DIRECT | GOOGLE | TRIPADVISOR (DB stores a plain string)
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
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${SOURCE_COLOR[r.source] || "bg-teal/10 text-teal"}`}
        >
          {SOURCE_LABEL[r.source] || "Verified stay"}
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

/**
 * @param initialReviews Server-fetched approved reviews (from the homepage
 *   server component). When provided, the client-side /api/reviews fetch is
 *   skipped entirely and the review cards are already in the initial HTML —
 *   crawlers see every review without executing JavaScript.
 * @param googleData LIVE data from the hotel's Google Business Profile via
 *   the Places API (src/lib/google-reviews.ts). When present: the aggregate
 *   badge shows Google's REAL rating + count, and Google's public reviews
 *   merge into the marquee with source = GOOGLE. Null (no API key / Place
 *   ID) = graceful fallback to database reviews only.
 */
export function Testimonials({
  initialReviews,
  googleData,
}: {
  initialReviews?: Review[];
  googleData?: GoogleReviewsData | null;
}) {
  const tLabel = useContentValue("testimonials.label", "Guests & devotees");
  const tTitle = useContentValue("testimonials.title", "Voices from our Braj family");
  // Aggregate rating shown ONLY when the owner sets a verifiable value
  // backed by a real review profile link (BUSINESS.reviews). Empty = hidden;
  const tRating = useContentValue("testimonials.aggregate_rating", "");
  // Merge order: owner-moderated DB reviews first, then Google's public
  // reviews (only when the Places API returned real data). Both arrays are
  // server-rendered; neither contains invented content.
  const googleAsReviews: Review[] = (googleData?.reviews || []).map((r, i) => ({
    id: `google-${i}`,
    guestName: r.author,
    guestLocation: r.relativeTime || null,
    rating: r.rating,
    title: r.text.length > 64 ? r.text.slice(0, 61).trimEnd() + "…" : r.text,
    body: r.text,
    source: "GOOGLE",
    verified: true,
  }));
  const allReviews = [...(initialReviews || []), ...googleAsReviews];
  const [reviews, setReviews] = useState<Review[]>(allReviews);
  const [loading, setLoading] = useState(!initialReviews);

  useEffect(() => {
    if (initialReviews) return; // server-rendered — no client fetch needed
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialReviews]);

  // Audit H5/H2: with zero approved reviews AND no live Google rating there
  // is nothing real to show — render nothing instead of an empty shell with
  // pulse skeletons. The section reappears automatically the moment a real
  // review is approved in admin (or Google Places data arrives).
  if (!loading && reviews.length === 0) return null;

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
            {tRating && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="font-serif text-2xl font-bold">{tRating}</span>
                  <span className="font-display text-sm text-ivory/70">/ 5</span>
                </div>
                <div className="hidden h-8 w-px bg-ivory/30 sm:block" />
                <div className="font-display text-sm text-ivory/80">
                  Aggregated from{" "}
                  <span className="font-semibold text-gold-soft">Google</span>,{" "}
                  <span className="font-semibold text-gold-soft">TripAdvisor</span> &amp; direct stays
                </div>
              </div>
            )}
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

      {/* Aggregate badge — links to the owner's real Google listing. When the
          Places API returns live data, the rating + count are Google's OWN
          real numbers. Otherwise it falls back to the owner-entered
          BUSINESS.rating — and renders ONLY when real values exist, so no
          invented numbers can ever appear. */}
      {(() => {
        const badgeRating = googleData?.rating || BUSINESS.rating.value;
        const badgeCount = googleData ? String(googleData.count) : BUSINESS.rating.count;
        if (!BUSINESS.reviews.google || !badgeRating || !badgeCount) return null;
        return (
      <div className="relative mt-16">
        <SectionDivider className="mb-8" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 sm:flex-row sm:gap-12">
          <a
            href={BUSINESS.reviews.google}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-ivory/15 bg-ivory/5 px-5 py-3 transition-all hover:border-gold/40 hover:bg-ivory/10"
          >
            <div className="font-serif text-2xl font-bold text-gold-soft">{badgeRating}</div>
            <div>
              <div className="font-display text-xs uppercase tracking-wider text-ivory/70">
                Google Reviews
              </div>
              <div className="flex items-center gap-1.5 font-display text-xs text-ivory/85">
                {badgeCount} reviews
                <ExternalLink className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </a>
        </div>
      </div>
        );
      })()}

      {/* TripAdvisor — link-only chip to the owner's REAL listing. Shows NO
          rating or count: TripAdvisor figures are never invented and cannot
          be fetched server-side, so the chip just says "Read our reviews". */}
      {BUSINESS.reviews.tripadvisor && (
      <div className="relative mt-16">
        <SectionDivider className="mb-8" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 sm:flex-row sm:gap-12">
          <a
            href={BUSINESS.reviews.tripadvisor}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-ivory/15 bg-ivory/5 px-5 py-3 transition-all hover:border-gold/40 hover:bg-ivory/10"
          >
            <div className="font-serif text-lg font-bold text-gold-soft">TripAdvisor</div>
            <div>
              <div className="font-display text-xs uppercase tracking-wider text-ivory/70">
                Verified listing
              </div>
              <div className="flex items-center gap-1.5 font-display text-xs text-ivory/85">
                Read our reviews
                <ExternalLink className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </a>
        </div>
      </div>
      )}
    </section>
  );
}
