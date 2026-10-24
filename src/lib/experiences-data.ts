export type Experience = {
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

// Shared, server-importable experience data (moved out of the client module so
// generateMetadata for /experiences/[slug] can read it on the server).
// Distances come from site.config BUSINESS.distances — the single source of
// truth shared with the homepage "Distances from RK Residency" section, so
// every page quotes the SAME figures (owner verifies them in one place).
import { BUSINESS } from "./site.config";

const D = BUSINESS.distances;
const fromConfig = (d: { km: string; time: string }, fbKm: string, fbTime: string) => ({
  distance: d.km ? `${d.km} km` : fbKm,
  walkTime: d.time || fbTime,
});

export const EXPERIENCES: Experience[] = [
  {
    slug: "banke-bihari-mandir",
    name: "Banke Bihari Mandir",
    ...fromConfig(D.bankeBihari, "0.45 km", "6 min walk"),
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
    image: "/uploads/rk-residency-vrindavan-banke-bihari-mandir.webp?auto=format&fit=crop&w=1400&q=80",
    accent: "from-marsala/85 to-marsala/30",
  },
  {
    slug: "iskcon-krishna-balaram",
    name: "ISKCON Sri Krishna Balaram Mandir",
    ...fromConfig(D.iskcon, "1.2 km", "15 min walk"),
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
    image: "/uploads/rk-residency-vrindavan-iskcon-temple.webp?auto=format&fit=crop&w=1400&q=80",
    accent: "from-teal/85 to-teal/30",
  },
  {
    slug: "prem-mandir",
    name: "Prem Mandir",
    ...fromConfig(D.premMandir, "2.0 km", "25 min walk"),
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
    image: "/uploads/rk-residency-vrindavan-prem-mandir.webp?auto=format&fit=crop&w=1400&q=80",
    accent: "from-gold/85 to-gold/30",
  },
  {
    slug: "nidhivan",
    name: "Nidhivan",
    // TODO(owner): fill BUSINESS.distances.nidhivan in site.config — the
    // figures below are the pre-existing site copy, unverified.
    distance: "2.8 km",
    walkTime: "40 min walk",
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
    image: "/uploads/rk-residency-vrindavan-nidhivan.webp?auto=format&fit=crop&w=1400&q=80",
    accent: "from-marsala/85 to-teal/40",
  },
  {
    slug: "yamuna-aarti-keshi-ghat",
    name: "Yamuna Aarti at Keshi Ghat",
    ...fromConfig(D.keshiGhat, "0.65 km", "8 min walk"),
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
    image: "/uploads/rk-residency-vrindavan-yamuna-aarti-keshi-ghat.webp",
    accent: "from-teal-deep/85 to-marsala/40",
  },
];
