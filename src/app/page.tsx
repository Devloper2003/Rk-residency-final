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
import { BookingWidget } from "@/components/rk/BookingWidget";
import { useRouter } from "@/lib/router";
import type { Room as RoomType } from "@/components/rk/Rooms";

export default function Home() {
  const bookingOpen = useRouter((s) => s.bookingOpen);
  const bookingRoomSlug = useRouter((s) => s.bookingRoomSlug);
  const openBooking = useRouter((s) => s.openBooking);
  const closeBooking = useRouter((s) => s.closeBooking);

  const [rooms, setRooms] = useState<RoomType[]>([]);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(() => {});
  }, []);

  const openBookingCb = useCallback(() => openBooking(), [openBooking]);
  const openBookingWithRoom = useCallback((room: RoomType) => openBooking(room.slug), [openBooking]);

  const preselectRoom = bookingRoomSlug
    ? rooms.find((r) => r.slug === bookingRoomSlug) || null
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: "RK Residency",
            description: "Heritage-luxury residency in Vrindavan on the banks of the Yamuna.",
            starRating: { "@type": "Rating", ratingValue: "5" },
            priceRange: "₹5,800 – ₹28,000",
            telephone: "+91-565-234-5678",
            email: "stay@rkresidency.in",
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
        <Rooms onBookRoom={openBookingWithRoom} />
        <Experiences />
        <Dining />
        <Gallery />
        <Offers onBookClick={openBookingCb} />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>

      <Footer />

      <FloatingWhatsApp />
      <ExitIntentModal onBookClick={openBookingCb} />

      <BookingWidget
        open={bookingOpen}
        onOpenChange={(o) => (o ? openBooking() : closeBooking())}
        preselectRoom={preselectRoom}
      />
    </div>
  );
}
