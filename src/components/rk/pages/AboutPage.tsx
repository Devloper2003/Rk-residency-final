"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, HandHeart, Award, Users, Quote } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus, PeacockFeather, CountUp, SectionDivider } from "../Motifs";
import { useContentValue, parseJsonArray } from "@/lib/site-content";

const VALUES = [
  { icon: HandHeart, title: "Atithi Devo Bhava", body: "A guest is a visiting deity. Every interaction — from check-in to turn-down — is conducted as a small act of devotion. We do not have 'customers'. We have guests." },
  { icon: Sparkles, title: "Heritage, never templated", body: "Every detail — the hand-carved teak, the marigold garland, the brass diya — is original, designed in collaboration with Braj artisans. Nothing is sourced from a hotel-supply catalogue." },
  { icon: Heart, title: "Spiritual luxury, not ostentatious", body: "We invest in calm, not chrome. The deepest comfort we offer is the absence of frenzy — a quiet room, a slow aarti, a thali cooked with prayers." },
  { icon: Award, title: "Genuine Braj roots", body: "We are not a hospitality company that came to Vrindavan. We are a Vrindavan family that learned hospitality. Our pandits, our chef, our concierge — all from Braj." },
];

const TIMELINE = [
  { year: "2024", title: "RK Residency Opens Its Doors", body: "Established in the holy city of Vrindavan, RK Residency was founded as a tribute to the legacy of Late Shri Ravi Karan Singh and a humble offering of service to the devotees of Shri Banke Bihari Ji. Every guest was welcomed with warmth, comfort, and heartfelt hospitality." },
  { year: "2025", title: "A Growing Family of Devotees", body: "Through genuine hospitality and memorable guest experiences, RK Residency earned the trust of pilgrims and travelers from across India. Our commitment to cleanliness, personalized service, and spiritual comfort became the foundation of our growing reputation." },
  { year: "2026", title: "Continuing a Legacy of Service", body: "Today, RK Residency continues its journey with the same purpose that inspired its beginning—to serve every devotee with excellence, preserve the values of faith and selfless hospitality, and make every stay in Vrindavan truly unforgettable." },
  
];

const TEAM = [
  { name: "Shailedra Singh", role: "Founder & Managing Director", bio: "Third-generation Vrindavan resident. Personally greets every guest at check-in." },
  { name: "Shikha Chaudhary", role: "Administrator", bio: "Committed to making every stay in Vrindavan comfortable, peaceful, and memorable." },
  { name: "Anil Sharma", role: "Operation Manager", bio: "Passionate about operational excellence and creating memorable guest experiences every day." },
  
];

const STATS = [
  { end: 3, suffix: "", label: "Years of paying hospitality" },
  { end: 35, suffix: "", label: "Rooms, suites & villas" },
  { end: 48000, suffix: "+", label: "Devotee guests hosted" },
  { end: 42, suffix: "", label: "Countries guests come from" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = { HandHeart, Sparkles, Heart, Award, Users, Quote };

export function AboutPage() {
  const titleLine1 = useContentValue("about.title_line1", "A divine home on the");
  const titleLine2 = useContentValue("about.title_line2", "Braj bhoomi");
  const image = useContentValue("about.image", "/uploads/5b87a4725175feac.webp");
  const imageAlt = useContentValue("about.image_alt", "A Peaceful Retreat in the Heart of Vrindavan");
  const imageCaptionLabel = useContentValue("about.image_caption_label", "Heart of Vrindavan");
  const imageCaptionSub = useContentValue("about.image_caption_sub", "A peaceful retreat on Parikrama Marg");
  const closingQuote = useContentValue("about.closing_quote", "Krishna sends them. We serve them. That is the arrangement.");
  const closingAttribution = useContentValue("about.closing_attribution", "— Shailedra Singh, Founder");
  const story = parseJsonArray<string>(useContentValue("about.story", "[]"), ["In 1986, Shyam Khandelwal's grandparents built a modest four-room house on Parikrama Marg.", "For twenty-eight years, the house was simply the Khandelwal home.", "In 2014, the family opened the residence to paying guests.", "Today, RK Residency has 35 rooms and the founding principle remains unchanged."]);
  const values = parseJsonArray<{ icon: string; title: string; body: string }>(useContentValue("about.values", "[]"), VALUES.map(v => ({ icon: v.icon.name, title: v.title, body: v.body })));
  const timeline = parseJsonArray<{ year: string; title: string; body: string }>(useContentValue("about.timeline", "[]"), TIMELINE);
  const team = parseJsonArray<{ name: string; role: string; bio: string }>(useContentValue("about.team", "[]"), TEAM);
  const stats = parseJsonArray<{ value: string; suffix: string; label: string }>(useContentValue("about.stats", "[]"), STATS.map(s => ({ value: String(s.end), suffix: s.suffix, label: s.label })));
  return (
    <PageShell
      title={`${titleLine1} ${titleLine2}`}
      subtitle="Where the Divine Blessings of Shri Banke Bihari Ji Welcome Every Guest into a World of Peace, Comfort, and Heartfelt Hospitality."
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
  Founded in <strong>2024</strong>, <span className="text-marsala">RK Residency</span> was established in the
  sacred city of Vrindavan as a heartfelt tribute to the legacy of
  <strong> Late Shri Ravi Karan Singh</strong>, whose supreme sacrifice during
  the <em className="text-teal">Kargil War</em> continues to inspire us.
  Guided by the divine blessings of <strong>Shri Banke Bihari Ji</strong>, our
  vision was to create more than just a hotel—a peaceful sanctuary where every
  devotee experiences comfort, warmth, and genuine hospitality.
</p>

<p>
  At RK Residency, we believe that every guest who visits the holy land of
  Vrindavan deserves to be welcomed with respect, compassion, and heartfelt
  care. Inspired by the timeless Indian tradition of
  <em className="text-teal"> "Atithi Devo Bhava"</em>, our dedicated team is
  committed to ensuring that every stay becomes a memorable part of each
  guest's spiritual journey.
</p>

<p>
  Since opening our doors, RK Residency has proudly welcomed thousands of
  pilgrims and travelers from across India. Every room has been thoughtfully
  designed to provide comfort and tranquility, while our personalized service,
  immaculate cleanliness, and peaceful atmosphere reflect the values upon which
  our hotel was founded.
</p>

<p>
  Today, <span className="text-marsala">RK Residency</span> continues to grow
  with the same purpose that inspired its beginning—to serve the devotees of
  <strong>Shri Banke Bihari Ji</strong> with humility, excellence, and warmth.
  More than a place to stay, RK Residency is a destination where
  <em className="text-teal"> faith, devotion, and hospitality</em> come
  together to create unforgettable memories in the heart of Vrindavan.
</p>
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={image}
                alt={imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-teal px-5 py-4 text-ivory">
              <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                {imageCaptionLabel}
              </div>
              <div className="font-serif text-lg">{imageCaptionSub}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 rounded-3xl border border-charcoal/10 bg-ivory-deep p-8">
        <SectionDivider className="mb-8" />
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-serif text-4xl font-bold text-teal sm:text-5xl">
                {s.value}{s.suffix}
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
          {values.map((v, i) => {
            const Icon = ICON_MAP[v.icon] || Heart;
            return (
            <Reveal key={i} delay={i * 0.06}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 transition-all hover:border-gold/40 hover:shadow-lg">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marsala/8 text-marsala">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-charcoal">{v.title}</h3>
                  <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">{v.body}</p>
                </div>
              </div>
            </Reveal>
            );
          })}
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
          "{closingQuote}"
        </p>
        <div className="mt-4 font-display text-xs uppercase tracking-wider text-charcoal-soft">
          {closingAttribution}
        </div>
      </div>
    </PageShell>
  );
}
