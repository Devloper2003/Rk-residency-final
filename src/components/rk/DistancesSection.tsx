"use client";

import { motion } from "framer-motion";
import { MapPin, Footprints, Car } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { BUSINESS } from "@/lib/site.config";

type Distance = { label: string; km: string; time: string };

/**
 * DistancesSection — exact, config-driven distances from the hotel to the
 * main temples and transport hubs. Replaces vague claims ("steps from",
 * "temples within 1.5 km") with exact km + walking/driving minutes.
 *
 * Data comes ONLY from site.config BUSINESS.distances — entries with an
 * empty km value (unfilled TODO) are omitted from the UI entirely.
 */
export function DistancesSection() {
  const entries: Distance[] = Object.values(BUSINESS.distances).filter(
    (d): d is Distance => Boolean(d && d.km && d.time)
  );

  if (entries.length === 0) return null;

  const isWalk = (t: string) => /walk/i.test(t);

  return (
    <section id="distances" className="relative bg-ivory-deep py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <MapPin size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Location
              </span>
              <MapPin size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Distances from RK Residency
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Exact distances to Vrindavan&apos;s most-loved temples and the
              main transport hubs — plan each darshan and arrival with real
              figures, not vague promises.
            </p>
          </Reveal>
        </div>

        {/* Distance cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((d, i) => (
            <Reveal key={d.label} delay={i * 0.05}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-serif text-base font-semibold leading-snug text-charcoal">
                    {d.label}
                  </span>
                  {isWalk(d.time) ? (
                    <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  ) : (
                    <Car className="mt-0.5 h-4 w-4 shrink-0 text-marsala" />
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-bold text-teal">
                    {d.km} km
                  </span>
                </div>
                <div className="mt-1 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                  {d.time}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-12">
            <SectionDivider className="mb-6" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
