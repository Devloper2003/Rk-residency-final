"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Footprints, Sun, Moon, Sunrise, ArrowRight } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useRouter } from "@/lib/router";

type Experience = {
  slug: string;
  name: string;
  distance: string;
  walkTime: string;
  bestTime: "dawn" | "day" | "evening";
  timings: string;
  description: string;
  longDescription: string;
  highlights: string[];
  tips: string[];
  image: string;
  accent: string;
};

export const EXPERIENCES: Experience[] = [
  {
    slug: "banke-bihari-mandir",
    name: "Banke Bihari Mandir",
    distance: "0.6 km",
    walkTime: "8 min walk",
    bestTime: "dawn",
    timings: "Mangala 7:45 AM · Evening 7:00 PM",
    description:
      "The most beloved temple of Vrindavan, home to the original Banke Bihari idol discovered by Swami Haridas.",
    longDescription:
      "Banke Bihari Mandir is the spiritual heart of Vrindavan. The idol of Banke Bihari (Krishna in his three-fold bent form, Tribhanga) was discovered by Swami Haridas in Nidhivan in the 16th century. The temple, built in 1864, follows a unique tradition — the deity's eyes are covered with a curtain that is pulled aside every few minutes, because it is believed that gazing too long into Banke Bihari's eyes would make the devotee faint with bhava (spiritual ecstasy). No Mangala-aarti is held in the morning (the only temple in Vrindavan where this is the case), because it is believed the Lord sleeps late after his night-long Raas Leela.",
    highlights: [
      "Original Tribhanga idol of Banke Bihari, discovered by Swami Haridas",
      "Unique curtain-pulling tradition — darshan every few minutes",
      "No morning Mangala aarti (Lord sleeps after Raas Leela)",
      "Reserve a private morning darshan pass via our concierge",
    ],
    tips: [
      "Arrive by 7:15 AM to be among the first 50 in queue",
      "Mobile phones and cameras must be left in lockers outside",
      "Dress modestly — shoulders and knees covered",
      "Avoid Saturdays and Janmashtami week unless pre-booked",
    ],
    image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1400&q=80",
    accent: "from-marsala/85 to-marsala/30",
  },
  {
    slug: "iskcon-krishna-balaram",
    name: "ISKCON Sri Krishna Balaram Mandir",
    distance: "1.4 km",
    walkTime: "18 min walk",
    bestTime: "evening",
    timings: "Sandhya Aarti 7:00 PM · Kirtan till 8:30 PM",
    description:
      "Founded by Srila Prabhupada in 1975, ISKCON Vrindavan is the international heart of Gaudiya Vaishnavism.",
    longDescription:
      "ISKCON Sri Krishna Balaram Mandir was established by A.C. Bhaktivedanta Swami Prabhupada in 1975, on the spot where Krishna and Balarama once played with their cowherd friends. The temple houses deities of Krishna-Balaram, Radha-Shyamasundar, and Gaura-Nitai. The evening sandhya aarti here is a transcendent experience — kartals, mridanga drums, and a kirtan that often runs past 8:30 PM. The temple complex includes the Samadhi of Prabhupada, a guesthouse, a pure-vegetarian restaurant (Govinda's), and the Vrindavan Institute for Higher Education. International devotees will find English-speaking guides and a 24-hour kirtan hall.",
    highlights: [
      "Founded 1975 by Srila Prabhupada — ISKCON's flagship Vrindavan temple",
      "Deities: Krishna-Balaram, Radha-Shyamasundar, Gaura-Nitai",
      "Evening sandhya aarti with kirtan past 8:30 PM",
      "Prabhupada's Samadhi mandir on-site",
      "Govinda's pure-vegetarian restaurant inside the complex",
    ],
    tips: [
      "Sandhya aarti at 7 PM is the most atmospheric time to visit",
      "Shoes must be removed at the entrance (free shoe stall available)",
      "Photography allowed in the courtyard, not inside the sanctum",
      "International visitors can request an English guide at the office",
    ],
    image: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1400&q=80",
    accent: "from-teal/85 to-teal/30",
  },
  {
    slug: "prem-mandir",
    name: "Prem Mandir",
    distance: "2.1 km",
    walkTime: "25 min walk",
    bestTime: "evening",
    timings: "Illumination 7:30 PM · Closes 9:00 PM",
    description:
      "A white-marble wonder built by Jagadguru Kripalu Maharaj in 2012, Prem Mandir is one of Vrindavan's most photographed temples.",
    longDescription:
      "Prem Mandir, meaning 'Temple of Divine Love', was inaugurated in 2012 by Jagadguru Kripalu Maharaj. Built entirely of Italian Carrara marble over 12 years at a cost of ₹150 crore, the temple is an architectural marvel — its walls are carved with scenes from Krishna's leelas (divine pastimes), and the 84-km parikrama path surrounding it tells the story of the Braj yatra. By day, the intricate carvings and 25-acre gardens are the attraction; by night, the temple transforms into a multi-coloured light spectacle that draws thousands. Our Prem Mandir View Rooms offer a private balcony vantage — the show is best watched without the crowds below.",
    highlights: [
      "Built 2012 by Jagadguru Kripalu Maharaj — 12-year construction",
      "Italian Carrara marble throughout, with carved Krishna leelas",
      "Nightly illumination show at 7:30 PM (multi-colour LED)",
      "25-acre themed gardens depicting Braj leelas",
      "Dancing fountain show in the evenings",
    ],
    tips: [
      "Arrive by 6:45 PM to find a good spot for the 7:30 PM illumination",
      "Wear comfortable shoes — the complex spans 25 acres",
      "Photography is permitted throughout the complex",
      "The temple is wheelchair accessible",
    ],
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80",
    accent: "from-gold/85 to-gold/30",
  },
  {
    slug: "nidhivan",
    name: "Nidhivan",
    distance: "0.9 km",
    walkTime: "12 min walk",
    bestTime: "day",
    timings: "Open till 6:00 PM · Closed after dusk",
    description:
      "The sacred grove where, it is believed, Krishna performs the Raas Leela every night with Radha and the gopis.",
    longDescription:
      "Nidhivan is the most sacred and most mysterious spot in Vrindavan — a grove of short, twisted tamal trees that, according to the Bhagavata, is where Krishna performs the Maha Raas Leela with Radha and the gopis every single night. The trees themselves are believed to be gopis in spiritual form. No one — not even the resident priests — stays inside the grove after sunset. A small Rang Mahal temple within the grove displays the bed prepared each night for Krishna and Radha; by morning, the bed is found disturbed, the ornaments scattered, and the sindoor used — proof, devotees believe, of the night's leela. The priest who prepares the bed does not enter after dusk, and tradition holds that anyone who sees the leela does not return to tell of it.",
    highlights: [
      "Sacred grove of tamal trees believed to be gopis in spirit form",
      "Site of the nightly Maha Raas Leela",
      "Rang Mahal temple with the bed prepared for Krishna & Radha",
      "Strict 6 PM closure — no one stays after dusk",
      "Bed found disturbed each morning — proof of the leela, devotees believe",
    ],
    tips: [
      "Visit between 5 AM and 5 PM only — the grove is closed at dusk",
      "Maintain silence and reverence — this is the most sacred site",
      "Do not attempt to stay after closing — tradition is strictly enforced",
      "Photography is allowed in the outer courtyard, not inside Rang Mahal",
    ],
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
    accent: "from-marsala/85 to-teal/40",
  },
  {
    slug: "yamuna-aarti-keshi-ghat",
    name: "Yamuna Aarti at Keshi Ghat",
    distance: "1.1 km",
    walkTime: "15 min walk",
    bestTime: "evening",
    timings: "Sunset Aarti · Daily (varies by season)",
    description:
      "Each evening at sunset, priests at Keshi Ghat perform the Yamuna Aarti — large brass lamps, conch shells, and ancient chants.",
    longDescription:
      "Keshi Ghat is the most important bathing ghat on the Yamuna in Vrindavan, named after the demon Keshi whom Krishna defeated here. Each evening at sunset, priests perform the Yamuna Aarti — a centuries-old ritual of large brass lamps, conch shells, and the ancient Yami-Krishna stotram chanted to the river. Pilgrims float small leaf-boats (dona) with marigold petals and a lit diya onto the river — an offering to Yamuna Devi. RK Residency arranges private boat access for our guests so you can witness the aarti from the water itself, an experience few visitors to Vrindavan ever have. The aarti timing shifts with the seasons — 5:30 PM in winter, 7:00 PM in summer — and our concierge confirms the exact time each morning.",
    highlights: [
      "Most important bathing ghat on the Yamuna in Vrindavan",
      "Daily sunset aarti with brass lamps and conch shells",
      "Float a marigold-and-diya leaf boat on the Yamuna",
      "Private boat access arranged by RK Residency concierge",
      "Site where Krishna defeated the demon Keshi",
    ],
    tips: [
      "Arrive 30 minutes before sunset for a good spot",
      "Private boat access — book via our concierge the morning of",
      "Be respectful of the river — do not throw plastic in the Yamuna",
      "Wear warm layers in winter — the ghat gets cold after sunset",
    ],
    image: "/images/yamuna-aarti.jpg",
    accent: "from-teal-deep/85 to-marsala/40",
  },
];

const BEST_TIME_META = {
  dawn: { label: "Best at Dawn", icon: Sunrise, color: "text-gold-deep" },
  day: { label: "Best by Day", icon: Sun, color: "text-marsala" },
  evening: { label: "Best at Evening", icon: Moon, color: "text-teal" },
} as const;

export function ExperiencesListPage() {
  const navigate = useRouter((s) => s.navigate);

  return (
    <PageShell
      title="The Braj yatra, curated for you"
      subtitle="Five sacred sites within a 25-minute walk of RK Residency. Tap any experience for full timings, history, highlights and pilgrim tips."
      accent="marsala"
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
    <PageShell title={exp.name} subtitle={exp.description} accent="marsala">
      {/* Hero image */}
      <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
        <img src={exp.image} alt={exp.name} className="h-full w-full object-cover" />
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
              href="tel:+915652345678"
              className="mt-4 inline-block rounded-full bg-teal px-5 py-2 font-serif text-sm font-semibold text-ivory transition-colors hover:bg-teal-deep"
            >
              +91 565 234 5678
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
