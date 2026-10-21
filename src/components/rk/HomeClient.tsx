"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/rk/Navbar";
import { Hero, TrustBadges } from "@/components/rk/Hero";
import { About } from "@/components/rk/About";
import { Rooms, type Room } from "@/components/rk/Rooms";
import { DistancesSection } from "@/components/rk/DistancesSection";
import { Experiences } from "@/components/rk/Experiences";
import { Dining } from "@/components/rk/Dining";
import { Gallery } from "@/components/rk/Gallery";
import { Offers } from "@/components/rk/Offers";
import { Testimonials, type Review } from "@/components/rk/Testimonials";
import { FAQ } from "@/components/rk/FAQ";
import { Contact } from "@/components/rk/Contact";
import { Footer } from "@/components/rk/Footer";
import { FloatingWhatsApp, ExitIntentModal } from "@/components/rk/FloatingActions";
import { ScrollProgress } from "@/components/rk/ScrollProgress";
import { useRouter } from "@/lib/router";
import { ArrowRight } from "lucide-react";

/** "See More" button that links to a dedicated page */
function SeeMoreButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex justify-center pb-4">
      <a
        href={href}
        className="group inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-6 py-2.5 font-display text-sm font-semibold text-teal transition-all hover:bg-teal hover:text-ivory"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

export type LatestPost = {
  id: string; slug: string; title: string; excerpt: string;
  imageUrl: string | null; category: string; readingMins: number;
};

/**
 * Homepage latest-posts section (Task 8) — server-rendered: the 3 newest
 * live stories are fetched by the home page and passed in, so titles,
 * excerpts, images and internal links to /blog/[slug] are all in the
 * initial HTML. The section is revalidated on publish (blog-publish.ts).
 */
function LatestPosts({ posts }: { posts: LatestPost[] }) {
  if (!posts.length) return null;
  return (
    <section id="latest-stories" className="bg-ivory py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
            Latest from the Braj Journal
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-display text-sm leading-relaxed text-charcoal-soft sm:text-base">
            Temple guides, festival explainers and local tips — written by our concierge team in Vrindavan.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <a
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl"
            >
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl || "/images/marigold-garland.webp"}
                  alt={p.title}
                  width={800}
                  height={450}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-lg font-semibold leading-snug text-charcoal group-hover:text-teal">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-2 font-display text-sm leading-relaxed text-charcoal-soft">
                  {p.excerpt}
                </p>
                <div className="mt-auto pt-3 inline-flex items-center gap-1 font-display text-sm font-semibold text-teal">
                  Read story
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeClient({ initialRooms, initialLatestPosts = [], initialReviews }: { initialRooms?: Room[]; initialLatestPosts?: LatestPost[]; initialReviews?: Review[] }) {
  const openBooking = useRouter((s) => s.openBooking);

  // SSR: rooms are fetched by the server page and rendered into the initial
  // HTML. The client fetch below remains only as a fallback.
  const [rooms, setRooms] = useState<Room[]>(initialRooms || []);

  useEffect(() => {
    if (initialRooms) return; // already rendered server-side
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(() => {});
  }, [initialRooms]);

  const openBookingCb = useCallback(() => openBooking(), [openBooking]);
  const openBookingWithRoom = useCallback((room: Room) => openBooking(room.slug), [openBooking]);

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      {/* Hotel + FAQPage JSON-LD are rendered server-side in
          src/app/(home)/page.tsx so they are always in the initial HTML. */}

      <ScrollProgress />
      <Navbar onBookClick={openBookingCb} />

      <main className="flex-1">
        <Hero onBookClick={openBookingCb} />
        <TrustBadges />
        <About />
        <SeeMoreButton href="/about" label="Read our full story" />
        {/* Exact, config-driven distances to temples + transport hubs */}
        <DistancesSection />
        {/* SSR rooms: cards + prices are in the initial HTML */}
        <Rooms onBookRoom={openBookingWithRoom} limit={3} initialRooms={initialRooms} />
        <SeeMoreButton href="/rooms" label="View all rooms & suites" />
        <Experiences limit={5} />
        <SeeMoreButton href="/experiences" label="Explore all Braj experiences" />
        <Dining />
        <SeeMoreButton href="/dining" label="See full dining menu" />
        <Gallery limit={8} />
        <SeeMoreButton href="/gallery" label="View full gallery" />
        <Offers onBookClick={openBookingCb} limit={3} />
        <SeeMoreButton href="/offers" label="See all offers & packages" />
        <Testimonials initialReviews={initialReviews} />
        {/* Latest blog stories — server-rendered internal links to /blog/[slug] */}
        <LatestPosts posts={initialLatestPosts} />
        <SeeMoreButton href="/blog" label="Read the Braj Journal" />
        <FAQ limit={6} />
        <Contact />
      </main>

      <Footer />

      <FloatingWhatsApp />
      <ExitIntentModal onBookClick={openBookingCb} />
      {/* BookingWidget is rendered globally in layout.tsx (GlobalBookingWidget) */}
    </div>
  );
}
