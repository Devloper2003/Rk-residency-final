"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Footprints, Sun, Moon, Sunrise, ArrowRight } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useRouter } from "@/lib/router";
import { useContactInfo } from "@/lib/use-contact-info";
import { EXPERIENCES as experiencesData, type Experience } from "@/lib/experiences-data";

export type { Experience };

/* Data moved to @/lib/experiences-data.ts (server-importable for SEO metadata). */
const EXPERIENCES = experiencesData;

const BEST_TIME_META = {
  dawn: { label: "Best at Dawn", icon: Sunrise, color: "text-gold-deep" },
  day: { label: "Best by Day", icon: Sun, color: "text-marsala" },
  evening: { label: "Best at Evening", icon: Moon, color: "text-teal" },
} as const;

export function ExperiencesListPage() {
  const navigate = useRouter((s) => s.navigate);

  return (
    <PageShell
      title="Vrindavan Temple & Braj Experiences"
      subtitle="Five sacred sites within a 25-minute walk of RK Residency. Tap any experience for full timings, history, highlights and pilgrim tips."
      accent="marsala"
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Experiences", path: "/experiences" },
      ]}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERIENCES.map((exp, i) => {
          const meta = BEST_TIME_META[exp.bestTime];
          const TimeIcon = meta.icon;
          return (
            <motion.button
              key={exp.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              onClick={() => navigate("experience-detail", exp.slug)}
              className="group block overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl focus-ring"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${exp.accent} mix-blend-multiply opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-gold/60 bg-charcoal/70 font-serif text-lg font-bold text-gold backdrop-blur-sm">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-gold/40 bg-charcoal/70 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
                  <TimeIcon className={`mr-1 inline h-3.5 w-3.5 ${meta.color}`} />
                  {meta.label}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                  <h3 className="font-serif text-xl font-semibold">{exp.name}</h3>
                  <p className="mt-1 font-display text-xs text-ivory/75">{exp.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-wrap gap-3 font-display text-xs text-charcoal-soft">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gold-deep" />
                    {exp.distance}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5 text-gold-deep" />
                    {exp.walkTime}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-display text-xs font-semibold text-teal">
                  Read more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
        <Lotus size={20} className="mx-auto mb-2 text-gold" />
        <p className="font-display text-sm text-charcoal-soft">
          Our concierge can arrange a private air-conditioned temple circuit (₹2,500/day) or
          a guided walking yatra with a resident Vrindavan scholar (₹1,200/session).
        </p>
      </div>
    </PageShell>
  );
}

export function ExperienceDetailPage({ slug }: { slug: string }) {
  const navigate = useRouter((s) => s.navigate);
  const info = useContactInfo();
  const exp = EXPERIENCES.find((e) => e.slug === slug);
  const idx = EXPERIENCES.findIndex((e) => e.slug === slug);
  const next = EXPERIENCES[(idx + 1) % EXPERIENCES.length];

  if (!exp) {
    return (
      <PageShell title="Experience not found" subtitle="This experience doesn’t exist.">
        <button
          onClick={() => navigate("experiences")}
          className="rounded-full bg-teal px-5 py-2 font-semibold text-ivory"
        >
          All experiences
        </button>
      </PageShell>
    );
  }

  const meta = BEST_TIME_META[exp.bestTime];
  const TimeIcon = meta.icon;

  return (
    <PageShell
      title={exp.name}
      subtitle={exp.description}
      accent="marsala"
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Experiences", path: "/experiences" },
        { name: exp.name, path: `/experiences/${exp.slug}` },
      ]}
    >
      {/* Hero image */}
      <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
        <img src={exp.image} alt={exp.name} width={1600} height={900} loading="eager" className="h-full w-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-tr ${exp.accent} mix-blend-multiply opacity-50`} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent" />
        <div className="absolute right-4 top-4 rounded-full border border-gold/40 bg-charcoal/70 px-4 py-2 text-sm font-medium text-ivory backdrop-blur-sm">
          <TimeIcon className={`mr-1.5 inline h-4 w-4 ${meta.color}`} />
          {meta.label}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
          <div className="flex flex-wrap gap-4 font-display text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gold-soft" />
              {exp.distance} from RK Residency
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Footprints className="h-4 w-4 text-gold-soft" />
              {exp.walkTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold-soft" />
              {exp.timings}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: long description */}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-charcoal">History &amp; significance</h2>
          <p className="mt-4 font-display text-base leading-relaxed text-charcoal-soft">
            {exp.longDescription}
          </p>

          <h3 className="mt-10 font-serif text-xl font-semibold text-charcoal">Highlights</h3>
          <ul className="mt-4 space-y-3">
            {exp.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <span className="font-display text-sm leading-relaxed text-charcoal-soft">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: tips card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-marsala/30 bg-marsala/5 p-6">
            <h3 className="font-serif text-lg font-semibold text-marsala">
              Pilgrim tips from our concierge
            </h3>
            <ul className="mt-4 space-y-3">
              {exp.tips.map((t) => (
                <li key={t} className="flex items-start gap-2 font-display text-sm text-charcoal-soft">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-marsala" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/5 p-6 text-center">
            <div className="font-display text-xs uppercase tracking-wider text-teal">
              Concierge assistance
            </div>
            <p className="mt-2 font-display text-sm text-charcoal-soft">
              Reserve a private darshan pass, English-speaking guide or temple
              transfers through our front desk.
            </p>
            <a
              href={info.telUrl}
              className="mt-4 inline-block rounded-full bg-teal px-5 py-2 font-serif text-sm font-semibold text-ivory transition-colors hover:bg-teal-deep"
            >
              {info.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Next experience */}
      <div className="mt-16">
        <div className="mb-6 flex items-center justify-center">
          <Lotus size={18} className="text-gold" />
          <span className="mx-3 font-display text-xs uppercase tracking-[0.28em] text-gold-deep">
            Next on the yatra
          </span>
          <Lotus size={18} className="text-gold" />
        </div>
        <button
          onClick={() => navigate("experience-detail", next.slug)}
          className="group relative block w-full overflow-hidden rounded-3xl border border-charcoal/10 shadow-lg"
        >
          <div className="relative h-64 sm:h-72">
            <img src={next.image} alt={next.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className={`absolute inset-0 bg-gradient-to-tr ${next.accent} mix-blend-multiply opacity-60`} />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
              <div className="font-display text-xs uppercase tracking-wider text-gold-soft">
                Up next · {next.distance} away
              </div>
              <div className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">{next.name}</div>
              <div className="mt-1 inline-flex items-center gap-1 font-display text-sm text-ivory/85">
                Continue the yatra
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </button>
      </div>
    </PageShell>
  );
}
