"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/rk/Navbar";
import { Hero, TrustBadges } from "@/components/rk/Hero";
import { About } from "@/components/rk/About";
import { Rooms, type Room } from "@/components/rk/Rooms";
import { Experiences } from "@/components/rk/Experiences";
import { Dining } from "@/components/rk/Dining";
import { Gallery } from "@/components/rk/Gallery";
import { Offers } from "@/components/rk/Offers";
import { Testimonials } from "@/components/rk/Testimonials";
import { FAQ } from "@/components/rk/FAQ";
import { Contact } from "@/components/rk/Contact";
import { Footer } from "@/components/rk/Footer";
import { FloatingWhatsApp, ExitIntentModal } from "@/components/rk/FloatingActions";
import { ScrollProgress } from "@/components/rk/ScrollProgress";
import { useRouter } from "@/lib/router";
import { BUSINESS } from "@/lib/site.config";
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

export function HomeClient({ initialRooms }: { initialRooms?: Room[] }) {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: "RK Residency",
            description: "A Soul Immersed in the Spirit of Vrindavan.",
            starRating: { "@type": "Rating", ratingValue: "5" },
            priceRange: "₹1,500 – ₹3,000",
            // Contact points come from site.config BUSINESS (owner TODOs).
            // Fields are omitted from the JSON-LD until real values exist —
            // structured data must never contain invented business data.
            ...(BUSINESS.phonePrimary ? { telephone: BUSINESS.phonePrimary } : {}),
            ...(BUSINESS.emailPrimary ? { email: BUSINESS.emailPrimary } : {}),
            address: { "@type": "PostalAddress", streetAddress: "Parikrama Marg, Vrindavan", addressLocality: "Vrindavan", addressRegion: "Uttar Pradesh", postalCode: "281121", addressCountry: "IN" },
            geo: { "@type": "GeoCoordinates", latitude: 27.5756, longitude: 77.7100 },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1240" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "What is your cancellation policy?", acceptedAnswer: { "@type": "Answer", text: "Free cancellation up to 72 hours before check-in." } },
              { "@type": "Question", name: "Is the food pure vegetarian?", acceptedAnswer: { "@type": "Answer", text: "Yes, strictly satvik." } },
            ],
          }),
        }}
      />

      <ScrollProgress />
      <Navbar onBookClick={openBookingCb} />

      <main className="flex-1">
        <Hero onBookClick={openBookingCb} />
        <TrustBadges />
        <About />
        <SeeMoreButton href="/about" label="Read our full story" />
        <Rooms onBookRoom={openBookingWithRoom} limit={3} />
        <SeeMoreButton href="/rooms" label="View all rooms & suites" />
        <Experiences limit={5} />
        <SeeMoreButton href="/experiences" label="Explore all Braj experiences" />
        <Dining />
        <SeeMoreButton href="/dining" label="See full dining menu" />
        <Gallery limit={8} />
        <SeeMoreButton href="/gallery" label="View full gallery" />
        <Offers onBookClick={openBookingCb} limit={3} />
        <SeeMoreButton href="/offers" label="See all offers & packages" />
        <Testimonials />
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
