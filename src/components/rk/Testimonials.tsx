import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useContentValue } from "@/lib/site-content";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote, ExternalLink, ChevronDown, X } from "lucide-react";
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
  avatarUrl?: string | null; // reviewer photo — shown when the owner adds one
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

/**
 * Uniform review card (owner request: "sabka size same rkho").
 * Every card is EXACTLY the same fixed size regardless of how long the
 * review text is — the title is capped at 2 lines and the body at 4 lines
 * (4 lines keeps the full card inside the fixed 350px height with the
 * relaxed line-height, so flexbox never has to squeeze a line in half).
 * When the body is longer than the visible window, a "View more" button
 * opens the full review in a modal, so no card ever grows tall and breaks
 * the row's uniform look.
 */
function ReviewCard({ r, onViewMore }: { r: Review; onViewMore: (r: Review) => void }) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(false);

  // Detect whether the body text actually overflows the 5-line clamp window.
  // Measured (not guessed from character counts) so the button only appears
  // when something really is hidden — re-measured once webfonts settle
  // (font swap changes line wrapping) and on viewport resize / device
  // rotation, because a narrower card needs more lines for the same text.
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const el = bodyRef.current;
      if (!cancelled && el) setClipped(el.scrollHeight > el.clientHeight + 2);
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [r.body]);

  return (
    <article className="mx-3 flex h-[350px] w-[320px] shrink-0 flex-col rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:w-[380px]">
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
      <Quote className="h-6 w-6 shrink-0 text-gold/40" />
      <h4 className="mt-2 line-clamp-2 font-serif text-lg font-semibold leading-snug text-charcoal">{r.title}</h4>
      <p
        ref={bodyRef}
        className="mt-2 line-clamp-4 font-display text-sm leading-relaxed text-charcoal-soft"
      >
        {r.body}
      </p>
      {clipped && (
        <button
          type="button"
          onClick={() => onViewMore(r)}
          className="mt-1.5 inline-flex w-fit items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-teal transition-opacity hover:opacity-75"
        >
          View more
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="mt-auto flex items-center gap-3 border-t border-charcoal/10 pt-4">
        {r.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.avatarUrl}
            alt={r.guestName}
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal/10 font-serif text-base font-semibold text-teal">
            {r.guestName.charAt(0)}
          </div>
        )}
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
 * Full-review modal opened by the card's "View more" button. Keeps every
 * marquee card at its fixed uniform size while still giving guests access
 * to the complete, untruncated review text (scrollable when very long).
 */
function ReviewModal({ r, onClose }: { r: Review; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Portal to <body>: fixed-position overlays must never live inside the
  // marquee section (overflow-hidden) or any transformed ancestor.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Review by ${r.guestName}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-charcoal/10 bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-charcoal/5 text-charcoal transition-colors hover:bg-charcoal/10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-3 flex items-center justify-between gap-3 pr-10">
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
        <h4 className="mt-2 font-serif text-xl font-semibold leading-snug text-charcoal">
          {r.title}
        </h4>
        <p className="mt-3 whitespace-pre-line font-display text-sm leading-relaxed text-charcoal-soft">
          {r.body}
        </p>
        <div className="mt-6 flex items-center gap-3 border-t border-charcoal/10 pt-4">
          {r.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.avatarUrl}
              alt={r.guestName}
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal/10 font-serif text-base font-semibold text-teal">
              {r.guestName.charAt(0)}
            </div>
          )}
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
      </div>
    </div>,
    document.body
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
  // OWNER RULE (Oct 2026): only REAL Google reviews are shown. Database rows
  // qualify solely when their source is GOOGLE (owner curates real Google
  // reviews in Admin → Reviews); seeded/demo DIRECT entries never render.
  // When neither source has content the section falls back to a compact
  // rating band linking to the Google Business Profile — nothing invented.
  const googleAsReviews: Review[] = (googleData?.reviews || []).map((r, i) => ({
    id: `google-${i}`,
    guestName: r.author,
    guestLocation: r.relativeTime || null,
    rating: r.rating,
    title: r.text.length > 64 ? r.text.slice(0, 61).trimEnd() + "…" : r.text,
    body: r.text,
    source: "GOOGLE",
    verified: true,
    avatarUrl: r.profilePhotoUrl || null,
  }));
  const realDbReviews = (initialReviews || []).filter((r) => r.source === "GOOGLE");
  const allReviews = [...realDbReviews, ...googleAsReviews];
  const [reviews, setReviews] = useState<Review[]>(allReviews);
  const [loading, setLoading] = useState(!initialReviews);
  // Full review shown in the modal when a guest taps "View more" on a card.
  const [modalReview, setModalReview] = useState<Review | null>(null);

  useEffect(() => {
    if (initialReviews) return; // server-rendered — no client fetch needed
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviews(((data.reviews || []) as Review[]).filter((r) => r.source === "GOOGLE"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialReviews]);

  // Audit H5/H2: with zero approved reviews AND no live Google rating there
  // is nothing real to show — render nothing instead of an empty shell with
  // pulse skeletons. The section reappears automatically the moment a real
  // review is approved in admin (or Google Places data arrives).
  // No real reviews anywhere → compact Google band instead of fabricated cards.
  const showCompact = !loading && reviews.length === 0;
  if (showCompact) {
    return (
      <section
        id="testimonials"
        className="relative overflow-hidden bg-teal py-16 text-ivory"
      >
        <div className="bg-yamuna-ripple pointer-events-none absolute inset-0 opacity-25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-gold text-gold" />
            ))}
          </div>
          <div className="font-serif text-xl font-semibold sm:text-2xl">
            {googleData
              ? `${parseFloat(googleData.rating).toFixed(1)} / 5 on Google`
              : "Rated by our guests on Google"}
          </div>
          <p className="max-w-xl font-display text-sm text-ivory/70">
            {googleData?.count
              ? `Based on ${googleData.count} public reviews on the RK Residency Google Business Profile.`
              : "Read verified, public reviews on the RK Residency Google Business Profile — we publish nothing that is not real."}
          </p>
          <a
            href={BUSINESS.reviews.google}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-charcoal transition-transform hover:scale-[1.03]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Read reviews on Google
          </a>
        </div>
      </section>
    );
  }

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
              <ReviewCard key={`${r.id}-${i}`} r={r} onViewMore={setModalReview} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-7xl gap-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[350px] w-80 shrink-0 animate-pulse rounded-3xl bg-ivory/10" />
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
      {modalReview && <ReviewModal r={modalReview} onClose={() => setModalReview(null)} />}
    </section>
  );
}
