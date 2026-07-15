"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronDown, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Diya } from "./Motifs";
import { WeatherWidget } from "./WeatherWidget";

export function Hero({ onBookClick }: { onBookClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax layers (disabled when reduced motion)
  const skyY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "30%"]);
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "18%"]);
  const foreY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "8%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.85]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-teal-deep"
    >
      {/* Layer 1 — sky / background image */}
      <motion.div style={{ y: skyY }} className="absolute inset-0 z-0">
        <div
          className="h-[120%] w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-vrindavan.jpg')" }}
          aria-hidden="true"
        />
      </motion.div>

      {/* Layer 2 — mid-ground temple silhouette & atmospheric overlay */}
      <motion.div style={{ y: midY }} className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-deep/30 via-teal-deep/20 to-charcoal/70" />
        <div className="absolute inset-0 bg-gradient-to-tr from-marsala/25 via-transparent to-gold/10" />
      </motion.div>

      {/* Layer 3 — foreground diya glow + Yamuna ripple */}
      <motion.div style={{ y: foreY }} className="absolute inset-x-0 bottom-0 z-20">
        <div className="bg-yamuna-ripple h-40 w-full opacity-60" />
        <div className="absolute -top-20 left-1/4 hidden md:block">
          <Diya size={48} className="text-gold opacity-90" />
        </div>
        <div className="absolute -top-12 right-1/4 hidden md:block">
          <Diya size={36} className="text-gold opacity-80" />
        </div>
      </motion.div>

      {/* Cinematic vignette + dark overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 z-30 bg-gradient-to-b from-charcoal/30 via-transparent to-charcoal/85"
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Tagline pill + weather */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap items-center justify-center gap-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-charcoal/30 px-4 py-1.5 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            <span className="font-display text-xs uppercase tracking-[0.3em] text-ivory/90">
              Vrindavan · On the banks of the Yamuna
            </span>
          </div>
          <WeatherWidget />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-4xl font-semibold leading-[1.05] text-ivory sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
        >
          Where the spirit of Braj
          <br />
          <span className="text-gold-foil italic">finds its rest</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl font-display text-base leading-relaxed text-ivory/85 sm:text-xl"
        >
          A heritage-luxury residency steps from Banke Bihari Mandir &amp; ISKCON Vrindavan.
          Calm, dignified comfort for pilgrims, devotee families and cultural travellers.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button
            onClick={onBookClick}
            className="cta-glow group rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-8 py-3.5 text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold"
          >
            <CalendarDays className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
            Check Availability
          </Button>
          <a
            href="#rooms"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full border border-ivory/40 bg-white/5 px-8 py-3.5 text-base font-semibold text-ivory backdrop-blur-sm transition-all hover:border-gold hover:bg-white/10 focus-ring"
          >
            Explore Rooms
          </a>
        </motion.div>

        {/* Rating proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-12 flex flex-col items-center gap-2 sm:flex-row sm:gap-6"
        >
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-sm font-medium text-ivory/90">
              4.9 · <span className="text-ivory/70">1,240+ verified stays</span>
            </span>
          </div>
          <div className="hidden h-4 w-px bg-ivory/30 sm:block" />
          <div className="text-xs uppercase tracking-wider text-ivory/70">
            Featured on Google · TripAdvisor
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 text-ivory/70 transition-colors hover:text-ivory focus-ring"
        aria-label="Scroll to discover more"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1"
        >
          <span className="font-display text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>
    </section>
  );
}

/** Trust badge strip shown just below hero on scroll. */
export function TrustBadges() {
  const badges = [
    { label: "Best Price Guarantee", sub: "Direct booking, no OTA commission" },
    { label: "Free Cancellation", sub: "Up to 72 hours before check-in" },
    { label: "Late Check-out", sub: "Complimentary till 2 PM on request" },
    { label: "Satvik Breakfast", sub: "Pure vegetarian, daily included" },
  ];
  return (
    <div className="relative z-30 -mt-px border-y border-gold/20 bg-teal text-ivory">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-ivory/10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {badges.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="px-6 py-5 text-center lg:text-left"
          >
            <div className="font-serif text-base font-semibold text-gold-soft">{b.label}</div>
            <div className="mt-1 font-display text-xs text-ivory/70">{b.sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
