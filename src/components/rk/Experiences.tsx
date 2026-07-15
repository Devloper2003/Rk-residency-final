"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock, MapPin, Footprints, Sun, Moon, Sunrise } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";

type Experience = {
  name: string;
  distance: string;
  walkTime: string;
  bestTime: "dawn" | "day" | "evening";
  timings: string;
  description: string;
  image: string;
  accent: string;
};

const EXPERIENCES: Experience[] = [
  {
    name: "Banke Bihari Mandir",
    distance: "0.6 km",
    walkTime: "8 min walk",
    bestTime: "dawn",
    timings: "Mangala 7:45 AM · Evening 7:00 PM",
    description:
      "The most beloved temple of Vrindavan, home to the original Banke Bihari idol discovered by Swami Haridas. The deity's eyes are covered with a curtain — pulled aside every few minutes because it is said that gazing too long would make Krishna irresistible. Our concierge arranges reserved darshan passes for the morning mangala aarti.",
    image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1200&q=80",
    accent: "from-marsala/85 to-marsala/30",
  },
  {
    name: "ISKCON Sri Krishna Balaram Mandir",
    distance: "1.4 km",
    walkTime: "18 min walk",
    bestTime: "evening",
    timings: "Sandhya Aarti 7:00 PM · Kirtan till 8:30 PM",
    description:
      "Founded by Srila Prabhupada in 1975, ISKCON Vrindavan is the international heart of Gaudiya Vaishnavism. The evening sandhya aarti here is a transcendent experience — kartals, mridanga, and a kirtan that often runs past 8:30 PM. International devotees will find English-speaking guides and a full prasadam hall.",
    image: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1200&q=80",
    accent: "from-teal/85 to-teal/30",
  },
  {
    name: "Prem Mandir",
    distance: "2.1 km",
    walkTime: "25 min walk",
    bestTime: "evening",
    timings: "Illumination 7:30 PM · Closes 9:00 PM",
    description:
      "A white-marble wonder built by Jagadguru Kripalu Maharaj in 2012. By day it is intricate carvings of Krishna's leelas; by night it transforms into a multi-coloured light spectacle that draws thousands. Our Prem Mandir View Rooms offer a private balcony vantage — the show is best watched without the crowds below.",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    accent: "from-gold/85 to-gold/30",
  },
  {
    name: "Nidhivan",
    distance: "0.9 km",
    walkTime: "12 min walk",
    bestTime: "day",
    timings: "Open till 6:00 PM · Closed after dusk",
    description:
      "The sacred grove where, it is believed, Krishna performs the Raas Leela every night with Radha and the gopis. No one — not even the resident priests — stays inside after sunset. A small Rang Mahal temple within the grove displays the bed prepared each night for Krishna and Radha, found disturbed by morning.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    accent: "from-marsala/85 to-teal/40",
  },
  {
    name: "Yamuna Aarti at Keshi Ghat",
    distance: "1.1 km",
    walkTime: "15 min walk",
    bestTime: "evening",
    timings: "Sunset Aarti · Daily (varies by season)",
    description:
      "Each evening at sunset, priests at Keshi Ghat perform the Yamuna Aarti — large brass lamps, conch shells, and the ancient chant of Yami-Krishna stotram. Pilgrims float small leaf-boats with marigold and diya onto the river. We arrange private boat access for our guests so you can witness the aarti from the water itself.",
    image: "/images/yamuna-aarti.jpg",
    accent: "from-teal-deep/85 to-marsala/40",
  },
];

const BEST_TIME_META = {
  dawn: { label: "Best at Dawn", icon: Sunrise, color: "text-gold-deep" },
  day: { label: "Best by Day", icon: Sun, color: "text-marsala" },
  evening: { label: "Best at Evening", icon: Moon, color: "text-teal" },
} as const;

export function Experiences() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <section
      id="experiences"
      className="relative overflow-hidden bg-charcoal py-24 text-ivory lg:py-32"
    >
      {/* Decorative Yamuna ripple */}
      <div className="bg-yamuna-ripple pointer-events-none absolute inset-0 opacity-20" />

      {/* Top decorative gold line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-soft">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Vrindavan Experiences
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              The Braj yatra,
              <br />
              <span className="text-gold-foil italic">curated for you</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-ivory/75 sm:text-lg">
              Five sacred sites within a 25-minute walk. Our concierge arranges
              reserved darshan, English-speaking guides, and private boat access
              for the Yamuna aarti — so you can travel like a pilgrim without
              the pilgrim's queues.
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line on desktop */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/40 to-transparent lg:block" />

          <div className="space-y-12 lg:space-y-24">
            {EXPERIENCES.map((exp, i) => {
              const isRight = i % 2 === 1;
              const meta = BEST_TIME_META[exp.bestTime];
              const TimeIcon = meta.icon;
              return (
                <div
                  key={exp.name}
                  className={`relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12 ${
                    isRight ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image side */}
                  <Reveal
                    as="div"
                    className="lg:w-1/2"
                    y={prefersReducedMotion ? 0 : 40}
                  >
                    <div className="group relative overflow-hidden rounded-3xl border border-gold/20 shadow-2xl">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={exp.image}
                          alt={`${exp.name} in Vrindavan`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div
                        className={`absolute inset-0 bg-gradient-to-tr ${exp.accent} mix-blend-multiply opacity-60`}
                      />
                      {/* Number badge */}
                      <div className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-charcoal/70 font-serif text-xl font-bold text-gold backdrop-blur-sm">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {/* Best time pill */}
                      <div className="absolute right-4 top-4 rounded-full border border-gold/40 bg-charcoal/70 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
                        <TimeIcon className={`mr-1 inline h-3.5 w-3.5 ${meta.color}`} />
                        {meta.label}
                      </div>
                    </div>
                  </Reveal>

                  {/* Center dot on desktop */}
                  <div className="absolute left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-gold bg-charcoal lg:block" />

                  {/* Text side */}
                  <Reveal as="div" className="lg:w-1/2" delay={0.05}>
                    <div className={isRight ? "lg:pl-8" : "lg:pr-8 lg:text-right"}>
                      <h3 className="font-serif text-2xl font-semibold text-gold-soft sm:text-3xl">
                        {exp.name}
                      </h3>
                      <div
                        className={`mt-2 flex flex-wrap gap-3 text-xs font-medium text-ivory/70 ${
                          isRight ? "" : "lg:justify-end"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          {exp.distance} from RK Residency
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Footprints className="h-3.5 w-3.5 text-gold" />
                          {exp.walkTime}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gold" />
                          {exp.timings}
                        </span>
                      </div>
                      <p className="mt-4 font-display text-base leading-relaxed text-ivory/85">
                        {exp.description}
                      </p>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <Reveal delay={0.1}>
          <div className="mt-20">
            <SectionDivider className="mb-6" />
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-sm text-ivory/75">
                Our concierge can arrange a private, air-conditioned temple
                circuit for ₹2,500 per day, or a guided walking yatra with a
                resident Vrindavan scholar for ₹1,200 per session.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
