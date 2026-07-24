"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Lotus, PeacockFeather, CountUp, Reveal, SectionDivider } from "./Motifs";

import { useContentValue, parseJsonArray } from "@/lib/site-content";
const stats = [
  { end: 3, suffix: "", label: "Years of Braj hospitality" },
  { end: 35, suffix: "", label: "Rooms, suites " },
  { end: 48000, suffix: "+", label: "Devotee guests hosted" },
  { end: 4, suffix: "", label: "Temples within 1.5 km" },
];

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const label = useContentValue("about.label", "Our Story");
  const titleLine1 = useContentValue("about.title_line1", "A divine on the");
  const titleLine2 = useContentValue("about.title_line2", "Braj bhoomi");
  const bodyP1 = useContentValue("about.body_p1", "");
  const bodyP2 = useContentValue("about.body_p2", "");
  const founderQuote = useContentValue("about.founder_quote", "");
  const founderName = useContentValue("about.founder_name", "");
  const image = useContentValue("about.image", "/uploads/5b87a4725175feac.webp");
  const imageAlt = useContentValue("about.image_alt", "Heritage room");
  const imageCaptionLabel = useContentValue("about.image_caption_label", "Heart of Vrindavan");
  const imageCaptionSub = useContentValue("about.image_caption_sub", "Heart of Vrindavan");
  const aboutStats = parseJsonArray(useContentValue("about.stats", "[]"), stats);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [prefersReducedMotion ? 0 : -60, prefersReducedMotion ? 0 : 60]);
  const textY = useTransform(scrollYProgress, [0, 1], [prefersReducedMotion ? 0 : 40, prefersReducedMotion ? 0 : -40]);

  return (
    <section
      id="about"
      ref={ref}
      className="relative overflow-hidden bg-ivory py-24 lg:py-32"
    >
      {/* Decorative peacock feather */}
      <PeacockFeather
        size={120}
        className="pointer-events-none absolute -left-8 top-16 hidden text-teal/15 lg:block"
      />
      <PeacockFeather
        size={90}
        className="pointer-events-none absolute -right-4 bottom-24 hidden rotate-180 text-marsala/15 lg:block"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Our Story
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              A divine  home on the
              <br />
              <span className="text-teal italic">Braj bhoomi</span>
            </h2>
          </Reveal>
        </div>

        {/* Split screen */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Image with parallax + jharokha frame */}
          <motion.div style={{ y: imageY }} className="relative">
            <div className="relative">
              {/* Outer arch frame */}
              <div className="relative overflow-hidden rounded-t-[180px] rounded-b-3xl border-4 border-gold/30 shadow-2xl">
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src="/uploads/5b87a4725175feac.webp"
                    alt="A Peaceful Retreat in the Heart of Vrindavan."
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Top arch gradient */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-charcoal/40 to-transparent" />
                {/* Bottom caption */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 to-transparent px-6 pb-5 pt-12">
                  <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
                    Heart of Vrindavan · Since 2024
                  </div>
                  <div className="font-serif text-lg text-ivory">
                    A Peaceful Retreat in the Heart of Vrindavan.
                  </div>
                </div>
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="absolute -bottom-8 -right-4 w-44 rounded-2xl bg-teal p-5 text-ivory shadow-xl lg:-right-8"
              >
                <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                  EST. 2024
                </div>
                <div className="mt-1 font-serif text-2xl font-semibold">
                  Trusted by
                  <br />
                   Thousands
                </div>
                <div className="mt-2 text-xs text-ivory/70">
                  of happy guests
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Text content */}
          <motion.div style={{ y: textY }}>
            <Reveal>
              <p className="font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">
                <span className="text-gold-deep">"</span>
                Inspired by the supreme sacrifice of Late Shri Ravi Karan Singh 
                and blessed by the divine grace of Shri Banke Bihari Ji, RK Residency 
                was created to welcome every devotee with warmth, peace, 
                and heartfelt hospitality in the sacred heart of Vrindavan.
                <span className="text-gold-deep">"</span>
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal-soft">
                <p>
                  Nestled in the holy city of Vrindavan, RK Residency 
                  is more than a hotel—it is a sanctuary where faith, 
                  comfort, and hospitality come together. Established in 
                  2024, our purpose has always been to create meaningful 
                  experiences for every pilgrim who walks through our doors.
                </p>
                <p>
                From elegantly designed accommodations to attentive 
                  service inspired by the spirit of Atithi Devo Bhava,
                  every detail reflects our dedication to making your 
                  stay peaceful, memorable, and worthy of the divine 
                  blessings of Shri Banke Bihari Ji.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#experiences"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("experiences")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border border-teal/40 px-5 py-2 text-sm font-semibold text-teal transition-all hover:bg-teal hover:text-ivory focus-ring"
                >
                  Discover Vrindavan
                </a>
                <span className="font-display text-xs uppercase tracking-wider text-charcoal-soft">
                  — Shailedra Singh, Founder & Managing Director
                </span>
              </div>
            </Reveal>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="mt-20">
          <SectionDivider className="mb-12" />
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="font-serif text-4xl font-bold text-teal sm:text-5xl lg:text-6xl">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 font-display text-xs uppercase tracking-[0.2em] text-charcoal-soft sm:text-sm">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
