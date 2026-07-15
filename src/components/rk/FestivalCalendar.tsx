"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Sparkles, ArrowRight } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { useRouter } from "@/lib/router";

type Festival = {
  name: string;
  nameHi: string;
  date: string;
  dateLabel: string;
  description: string;
  significance: string;
  where: string;
  bestFor: string;
  accent: "teal" | "gold" | "marsala";
  icon: string;
};

const FESTIVALS: Festival[] = [
  {
    name: "Makar Sankranti",
    nameHi: "मकर संक्रांति",
    date: "2026-01-14",
    dateLabel: "January 14, 2026",
    description: "The sun enters Capricorn. Kite festival in Braj; devotees take a holy dip in the Yamuna at Keshi Ghat. Til-gur (sesame-jaggery) prasadam is distributed.",
    significance: "Marks the beginning of the sun's northward journey (Uttarayan). Lord Krishna is said to have blessed the Braj region on this day.",
    where: "Keshi Ghat, ISKCON",
    bestFor: "Quiet pilgrimage, holy dip",
    accent: "gold",
    icon: "☀️",
  },
  {
    name: "Vasant Panchami",
    nameHi: "वसंत पंचमी",
    date: "2026-02-02",
    dateLabel: "February 2, 2026",
    description: "The arrival of spring. Yellow is the colour of the day — yellow marigolds, yellow clothes, yellow sweet rice (meetha chawal) in all temples.",
    significance: "Goddess Saraswati's birthday. In Braj, also celebrates Krishna's spring pastimes with the gopis.",
    where: "Banke Bihari, ISKCON",
    bestFor: "Cultural immersion, photography",
    accent: "gold",
    icon: "🌼",
  },
  {
    name: "Holi — Braj Festival",
    nameHi: "होली",
    date: "2026-03-13",
    dateLabel: "March 8–15, 2026",
    description: "The most colourful festival in Braj. Phoolon ki Holi (flower Holi) at Banke Bihari, Lathmar Holi in Barsana, and a private gulal celebration on our rooftop.",
    significance: "Celebrates Krishna's playful Holi with Radha and the gopis. Braj Holi is a week-long affair, not a single day.",
    where: "Barsana, Nandgaon, Banke Bihari",
    bestFor: "Once-in-a-lifetime experience",
    accent: "marsala",
    icon: "🎨",
  },
  {
    name: "Radhashtami",
    nameHi: "राधाष्टमी",
    date: "2026-09-04",
    dateLabel: "September 4, 2026",
    description: "Radha's birthday. The Radha Raman Temple holds a grand abhishek. A quieter, more devotional festival than Janmashtami — favoured by serious pilgrims.",
    significance: "Celebrates the appearance of Radharani, Krishna's divine consort and the source of all shakti.",
    where: "Radha Raman Temple, Barsana",
    bestFor: "Devotional depth, smaller crowds",
    accent: "marsala",
    icon: "🌸",
  },
  {
    name: "Janmashtami",
    nameHi: "जन्माष्टमी",
    date: "2026-08-25",
    dateLabel: "August 25, 2026",
    description: "Krishna's birthday — the most sacred night in Braj. Midnight abhishek at Banke Bihari, all-night kirtan at ISKCON, and a rooftop feast at RK Residency.",
    significance: "Celebrates the birth of Lord Krishna at midnight. The entire Braj region transforms for five days.",
    where: "All major temples",
    bestFor: "The full Braj experience",
    accent: "teal",
    icon: "🦚",
  },
  {
    name: "Sharad Purnima",
    nameHi: "शरद पूर्णिमा",
    date: "2026-10-25",
    dateLabel: "October 25, 2026",
    description: "The autumn full moon. Krishna is said to have performed the Maha Raas Leela on this night. Kheer is left under moonlight overnight as prasadam.",
    significance: "Celebrates the Maha Raas — Krishna dancing with all the gopis simultaneously, expanding himself for each.",
    where: "Nidhivan, Seva Kunj",
    bestFor: "Mystical, moonlit devotion",
    accent: "gold",
    icon: "🌕",
  },
];

const ACCENT_BG = {
  teal: "from-teal/10 to-transparent border-teal/20",
  gold: "from-gold/10 to-transparent border-gold/20",
  marsala: "from-marsala/10 to-transparent border-marsala/20",
};

const ACCENT_TEXT = {
  teal: "text-teal",
  gold: "text-gold-deep",
  marsala: "text-marsala",
};

export function FestivalCalendar() {
  const navigate = useRouter((s) => s.navigate);

  // Sort by date
  const sorted = [...FESTIVALS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section id="festivals" className="relative bg-charcoal py-24 text-ivory lg:py-32">
      <div className="bg-yamuna-ripple pointer-events-none absolute inset-0 opacity-15" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-soft">
              <Calendar className="h-4 w-4" />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Braj Festival Calendar 2026
              </span>
              <Calendar className="h-4 w-4" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Sacred seasons of Braj
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-ivory/75 sm:text-lg">
              Vrindavan's spiritual calendar shapes everything — the crowds, the
              mood, the rates, the darshan. Plan your pilgrimage around these
              six sacred festivals for the deepest experience.
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent sm:left-1/2 sm:block" />

          <div className="space-y-8 sm:space-y-16">
            {sorted.map((f, i) => {
              const isRight = i % 2 === 1;
              return (
                <div
                  key={f.name}
                  className={`relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8 ${
                    isRight ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  {/* Date marker (desktop) */}
                  <div className="hidden sm:block sm:w-1/2" />
                  <div className="absolute left-4 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-gold bg-charcoal sm:left-1/2 sm:block" />

                  {/* Card */}
                  <Reveal className={`sm:w-1/2 ${isRight ? "sm:pl-8" : "sm:pr-8"}`}>
                    <div className={`rounded-3xl border bg-gradient-to-br ${ACCENT_BG[f.accent]} p-6 backdrop-blur-sm`}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{f.icon}</span>
                            <h3 className="font-serif text-xl font-semibold text-ivory">
                              {f.name}
                            </h3>
                          </div>
                          <div className="mt-0.5 font-display text-xs text-gold-soft">
                            {f.nameHi}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-serif text-lg font-bold ${ACCENT_TEXT[f.accent]}`}>
                            {f.dateLabel.split(",")[0]}
                          </div>
                          <div className="font-display text-[10px] text-ivory/60">
                            {f.dateLabel.split(",")[1]}
                          </div>
                        </div>
                      </div>

                      <p className="font-display text-sm leading-relaxed text-ivory/85">
                        {f.description}
                      </p>

                      <div className="mt-4 space-y-1.5 border-t border-ivory/10 pt-3">
                        <div className="flex items-start gap-2 font-display text-xs text-ivory/70">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-soft" />
                          <span><strong className="text-ivory/90">Significance:</strong> {f.significance}</span>
                        </div>
                        <div className="flex items-start gap-2 font-display text-xs text-ivory/70">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-soft" />
                          <span><strong className="text-ivory/90">Where:</strong> {f.where}</span>
                        </div>
                        <div className="flex items-start gap-2 font-display text-xs text-ivory/70">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-soft" />
                          <span><strong className="text-ivory/90">Best for:</strong> {f.bestFor}</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Reveal delay={0.1}>
          <div className="mt-20">
            <SectionDivider className="mb-8" />
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-display text-sm text-ivory/75">
                Festival-period bookings include concierge-arranged darshan passes,
                temple transfers and festival-feast seating. Book 4–6 months in
                advance — festival periods sell out fast.
              </p>
              <button
                onClick={() => navigate("offers")}
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-6 py-3 font-serif text-base font-semibold text-charcoal transition-all hover:from-gold-deep hover:to-gold cta-glow"
              >
                View festival packages
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
