"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, HandHeart, Award, Users, Quote } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus, PeacockFeather, CountUp, SectionDivider } from "../Motifs";

const VALUES = [
  { icon: HandHeart, title: "Atithi Devo Bhava", body: "A guest is a visiting deity. Every interaction — from check-in to turn-down — is conducted as a small act of devotion. We do not have 'customers'. We have guests." },
  { icon: Sparkles, title: "Heritage, never templated", body: "Every detail — the hand-carved teak, the marigold garland, the brass diya — is original, designed in collaboration with Braj artisans. Nothing is sourced from a hotel-supply catalogue." },
  { icon: Heart, title: "Spiritual luxury, not ostentatious", body: "We invest in calm, not chrome. The deepest comfort we offer is the absence of frenzy — a quiet room, a slow aarti, a thali cooked with prayers." },
  { icon: Award, title: "Genuine Braj roots", body: "We are not a hospitality company that came to Vrindavan. We are a Vrindavan family that learned hospitality. Our pandits, our chef, our concierge — all from Braj." },
];

const TIMELINE = [
  { year: "1986", title: "The Khandelwal home", body: "Shyam Khandelwal's grandparents build a four-room house on Parikrama Marg. The family hosts every visiting sadhu and pilgrim that knocks." },
  { year: "2014", title: "Five rooms, no signboard", body: "After three generations, the family opens the residence to its first paying guests. Word spreads through temple circles — no marketing needed." },
  { year: "2018", title: "Heritage Wing opens", body: "The residence expands to 35 rooms across three wings, all designed by Braj artisans. The original four rooms become the Bansuri Heritage Rooms." },
  { year: "2022", title: "Gokul Royal Villa", body: "The two-bedroom villa with private courtyard is added for satsang groups and intimate celebrations. The in-house pandit service begins." },
  { year: "2026", title: "Today", body: "RK Residency hosts 48,000+ devotee guests from 42 countries. The founding principle — a guest is a visiting deity — remains unchanged." },
];

const TEAM = [
  { name: "Shyam Khandelwal", role: "Founder & Host", bio: "Third-generation Vrindavan resident. Personally greets every guest at check-in." },
  { name: "Meera Khandelwal", role: "Kitchen & Cuisine", bio: "Trained in satvik cooking by the cooks of Banke Bihari Mandir. Heads the rooftop kitchen." },
  { name: "Pandit Ramesh Sharma", role: "Resident Pandit", bio: "Conducts pujas, havans and satsangs. 25 years at the Banke Bihari aarti before joining us." },
  { name: "Anand Tiwari", role: "Head Concierge", bio: "Walked every ghat and temple of Braj for 18 years. Arranges darshan passes and guided yatras." },
];

const STATS = [
  { end: 12, suffix: "", label: "Years of paying hospitality" },
  { end: 35, suffix: "", label: "Rooms, suites & villas" },
  { end: 48000, suffix: "+", label: "Devotee guests hosted" },
  { end: 42, suffix: "", label: "Countries guests come from" },
];

export function AboutPage() {
  return (
    <PageShell
      title="A heritage home on the banks of the Yamuna"
      subtitle="RK Residency began as the Khandelwal family home — a household that for three generations hosted every visiting sadhu, kirtaniya and pilgrim family that knocked on its door."
      accent="teal"
    >
      <PeacockFeather size={100} className="pointer-events-none absolute right-4 top-24 hidden rotate-12 text-teal/10 lg:block" />

      {/* Story */}
      <div className="mb-16 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            Our story
          </h2>
          <div className="mt-5 space-y-4 font-display text-base leading-relaxed text-charcoal-soft">
            <p>
              In 1986, Shyam Khandelwal's grandparents — both Vrindavan natives — built a
              modest four-room house on Parikrama Marg, a five-minute walk from Banke Bihari
              Mandir. They were not hoteliers; they were a Braj family. And like every Braj
              family of their generation, they believed that the door of a home should never
              be closed to a visitor.
            </p>
            <p>
              For twenty-eight years, the house was simply the Khandelwal home. Sadhus on
              parikrama stayed the night. Kirtaniyas from Bengal and Maharashtra came for the
              festival seasons. ISKCON devotees from the West, lost and jet-lagged, were
              fed satvik thalis at the family table. No one was charged. The family's
              grandmother, Sushila Devi, would say: <em className="text-teal">"Krishna sends
              them. We serve them. That is the arrangement."</em>
            </p>
            <p>
              In 2014, after Sushila Devi's passing, the family made a difficult decision —
              to honour her memory by opening the residence to paying guests, so the
              hospitality she had practised for free could be sustained for generations to
              come. They converted five rooms, hired no consultant, printed no brochure. The
              signboard was a simple brass plate by the door: <span className="text-marsala">RK Residency</span>.
            </p>
            <p>
              By 2018, word-of-mouth among temple circles had filled the residence year-round.
              The family added the Heritage Wing, then the Gokul Royal Villa. Today, RK
              Residency has 35 rooms, a rooftop dining pavilion, an in-house pandit, and a
              concierge team that can arrange darshan at every major Braj temple. But the
              founding principle — <em className="text-teal">atithi devo bhava</em>, a guest
              is a visiting deity — has never been a slogan. It is how the family was raised.
            </p>
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="/images/heritage-room.jpg"
                alt="Heritage room interior at RK Residency"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-teal px-5 py-4 text-ivory">
              <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                Heritage Wing · Est. 2014
              </div>
              <div className="font-serif text-lg">Hand-carved teak · Makrana marble</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 rounded-3xl border border-charcoal/10 bg-ivory-deep p-8">
        <SectionDivider className="mb-8" />
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-4xl font-bold text-teal sm:text-5xl">
                <CountUp end={s.end} suffix={s.suffix} />
              </div>
              <div className="mt-2 font-display text-xs uppercase tracking-[0.2em] text-charcoal-soft sm:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <div className="mb-8 text-center">
          <Lotus size={20} className="mx-auto mb-2 text-gold" />
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            What we believe
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 transition-all hover:border-gold/40 hover:shadow-lg">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marsala/8 text-marsala">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-charcoal">{v.title}</h3>
                  <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">{v.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-16">
        <div className="mb-10 text-center">
          <Lotus size={20} className="mx-auto mb-2 text-gold" />
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            Our journey
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-gold/40 via-gold/40 to-transparent sm:left-1/2" />
          <div className="space-y-8">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.05}>
                <div className={`relative flex gap-6 sm:w-1/2 ${i % 2 === 0 ? "sm:ml-0 sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"}`}>
                  <div className={`absolute top-2 grid h-8 w-8 place-items-center rounded-full border-2 border-gold bg-ivory font-serif text-xs font-bold text-gold-deep ${
                    i % 2 === 0 ? "left-0 sm:left-auto sm:-right-4" : "left-0 sm:-left-4"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="ml-12 sm:ml-0">
                    <div className="font-serif text-2xl font-bold text-teal">{t.year}</div>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-charcoal">{t.title}</h3>
                    <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">{t.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <div className="mb-10 text-center">
          <Lotus size={20} className="mx-auto mb-2 text-gold" />
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            The people who host you
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.06}>
              <div className="rounded-3xl border border-charcoal/10 bg-white p-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal/8 font-serif text-2xl font-bold text-teal">
                  {m.name.charAt(0)}
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold text-charcoal">{m.name}</h3>
                <div className="font-display text-xs uppercase tracking-wider text-gold-deep">{m.role}</div>
                <p className="mt-2 font-display text-xs leading-relaxed text-charcoal-soft">{m.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Closing quote */}
      <div className="rounded-3xl border border-gold/30 bg-gold/5 p-8 text-center">
        <Quote className="mx-auto h-8 w-8 text-gold" />
        <p className="mx-auto mt-3 max-w-2xl font-serif text-xl italic leading-relaxed text-charcoal sm:text-2xl">
          "Krishna sends them. We serve them. That is the arrangement."
        </p>
        <div className="mt-4 font-display text-xs uppercase tracking-wider text-charcoal-soft">
          — Sushila Devi Khandelwal, grandmother of the founder
        </div>
      </div>
    </PageShell>
  );
}
