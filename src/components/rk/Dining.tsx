"use client";

import { motion } from "framer-motion";
import {
  Leaf,
  Soup,
  Wheat,
  Flower2,
  Flame,
  Droplets,
  HandPlatter,
  Sparkles,
  Wifi,
  Car,
  BellRing,
  Bath,
  Dumbbell,
  BookOpen,
  Baby,
  ShieldCheck,
} from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";

const SATVIK_PRINCIPLES = [
  {
    icon: Leaf,
    title: "Pure Vegetarian",
    body: "No onion, no garlic, no eggs — in strict keeping with Braj tradition.",
  },
  {
    icon: Wheat,
    title: "Locally Sourced",
    body: "Grains from local Braj farmers, vegetables from our own kitchen garden.",
  },
  {
    icon: Flame,
    title: "Cooked with Prayers",
    body: "Every meal begins with a kitchen aarti — food as prasadam, not just sustenance.",
  },
  {
    icon: Droplets,
    title: "Filtered Yamuna Water",
    body: "Triple-filtered, UV-purified water used for cooking — never bottled plastic.",
  },
];

const SIGNATURE_DISHES = [
  {
    name: "Braj Thali",
    desc: "Seven seasonal preparations on a heritage brass plate — chapati, rice, two sabzis, dal, kadhi, sweet.",
    price: "₹650",
    veg: true,
  },
  {
    name: "Makhan Mishri Prasadam",
    desc: "Fresh-churned white butter with crystal sugar — Krishna's favourite, served at sunrise.",
    price: "₹240",
    veg: true,
  },
  {
    name: "Satvik Puri-Sabzi",
    desc: "Puffed whole-wheat puris with a slow-cooked potato-tomato sabzi. The Banke Bihari breakfast.",
    price: "₹380",
    veg: true,
  },
  {
    name: "Rabri-Jalebi",
    desc: "Thickened milk rabri from a Braj halwai paired with hot, crisp jalebis. Evening only.",
    price: "₹320",
    veg: true,
  },
];

const AMENITIES = [
  { icon: Sparkles, label: "Daily Satvik Breakfast", group: "Dining" },
  { icon: HandPlatter, label: "In-room Dining till 10 PM", group: "Dining" },
  { icon: BellRing, label: "Brass Diya Turn-down Ritual", group: "Service" },
  { icon: Bath, label: "Ayurvedic Spa (Sat-Sundays)", group: "Wellness" },
  { icon: Dumbbell, label: "Yoga Pavilion at Sunrise", group: "Wellness" },
  { icon: Flower2, label: "Marigold Garland Daily", group: "Service" },
  { icon: Wifi, label: "High-speed Wi-Fi", group: "Connectivity" },
  { icon: Car, label: "Airport & Temple Transfers", group: "Transport" },
  { icon: BookOpen, label: "Spiritual Library & Puja Nook", group: "Leisure" },
  { icon: Baby, label: "Family & Kids' Satvik Menu", group: "Family" },
  { icon: ShieldCheck, label: "24/7 Security & Doctor-on-call", group: "Safety" },
  { icon: Soup, label: "Private Satsang Catering", group: "Events" },
];

export function Dining() {
  return (
    <section id="dining" className="relative bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Satvik Dining
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              Food as prasadam,
              <br />
              <span className="text-marsala italic">not just sustenance</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Our kitchen follows the strict satvik tradition of Braj — no onion,
              no garlic, no eggs. Every meal is prepared after a kitchen aarti
              and served as prasadam. The rooftop dining pavilion overlooks the
              Yamuna and serves dinner under candlelight.
            </p>
          </Reveal>
        </div>

        {/* Main grid: image + principles */}
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          {/* Image */}
          <Reveal>
            <div className="relative h-full min-h-[420px] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
              <img
                src="/images/satvik-dining.jpg"
                alt="Satvik thali on a heritage brass plate at RK Residency"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
                  Rooftop Yamuna Pavilion
                </div>
                <div className="mt-1 font-serif text-2xl">
                  Dinner under candlelight, 7 PM – 10 PM
                </div>
              </div>
            </div>
          </Reveal>

          {/* Principles */}
          <Reveal delay={0.08}>
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
              {SATVIK_PRINCIPLES.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6 }}
                  className="group rounded-2xl border border-charcoal/10 bg-white p-5 transition-all hover:border-gold/40 hover:shadow-lg"
                >
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-teal/8 text-teal transition-colors group-hover:bg-teal group-hover:text-ivory">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-charcoal">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">
                    {p.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Signature dishes menu */}
        <Reveal delay={0.1}>
          <div className="mt-16 overflow-hidden rounded-3xl border border-charcoal/10 bg-ivory-deep">
            <div className="border-b border-charcoal/10 bg-teal px-6 py-4 text-ivory">
              <h3 className="font-serif text-xl font-semibold text-gold-soft">
                Signature dishes
              </h3>
              <p className="font-display text-xs uppercase tracking-wider text-ivory/70">
                Available daily · In-room or rooftop
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-charcoal/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
              {SIGNATURE_DISHES.map((d) => (
                <div key={d.name} className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-teal" />
                      <h4 className="font-serif text-lg font-semibold text-charcoal">{d.name}</h4>
                    </div>
                    <p className="mt-1.5 max-w-sm font-display text-sm leading-relaxed text-charcoal-soft">
                      {d.desc}
                    </p>
                  </div>
                  <div className="shrink-0 font-serif text-lg font-bold text-marsala">
                    {d.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Amenities sub-section */}
      <AmenitiesGrid />
    </section>
  );
}

function AmenitiesGrid() {
  return (
    <div id="amenities" className="mt-24 lg:mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionDivider className="mb-12" />
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Amenities &amp; Wellness
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Every comfort, respectfully offered
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AMENITIES.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.05, duration: 0.5 }}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-charcoal/10 bg-white p-4 transition-all hover:border-gold/40 hover:shadow-md"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-marsala/8 text-marsala transition-colors group-hover:bg-marsala group-hover:text-ivory">
                <a.icon className="h-5 w-5" />
              </div>
              <div className="font-serif text-sm font-semibold text-charcoal">{a.label}</div>
              <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                {a.group}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
