"use client";

import { Navbar } from "@/components/rk/Navbar";
import { Hero, TrustBadges } from "@/components/rk/Hero";
import { About } from "@/components/rk/About";
import { Rooms, type Room } from "@/components/rk/Rooms";
import { Experiences } from "@/components/rk/Experiences";
import { Dining } from "@/components/rk/Dining";
import { Gallery } from "@/components/rk/Gallery";
import { Offers } from "@/components/rk/Offers";
import { Testimonials } from "@/components/rk/Testimonials";
import { Contact } from "@/components/rk/Contact";
import { Footer } from "@/components/rk/Footer";
import { FloatingWhatsApp, ExitIntentModal } from "@/components/rk/FloatingActions";

/**
 * The home page sections (below the navbar). Kept in its own file so that the
 * root page.tsx stays a thin shell that can lazy-load this + the overlay routes
 * — Turbopack then compiles each in its own worker pass and stays within the
 * sandbox's memory budget.
 */
export function HomeSections({
  onBook,
  onBookRoom,
}: {
  onBook: () => void;
  onBookRoom: (room: Room) => void;
}) {
  return (
    <>
      <Navbar onBookClick={onBook} />
      <main className="flex-1">
        <Hero onBookClick={onBook} />
        <TrustBadges />
        <About />
        <Rooms onBookRoom={onBookRoom} />
        <Experiences />
        <Dining />
        <Gallery />
        <Offers onBookClick={onBook} />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <ExitIntentModal onBookClick={onBook} />
    </>
  );
}
