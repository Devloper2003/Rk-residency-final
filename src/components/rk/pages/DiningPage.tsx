"use client";

import { motion } from "framer-motion";
import {
  Leaf, Soup, Wheat, Flower2, Flame, Droplets, HandPlatter, Sparkles, Clock,
} from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus, SectionDivider } from "../Motifs";

const PRINCIPLES = [
  { icon: Leaf, title: "Pure Vegetarian (Satvik)", body: "No onion, no garlic, no eggs — in strict keeping with Braj tradition. Food is prepared to elevate sattva — clarity and devotion." },
  { icon: Wheat, title: "Locally Sourced", body: "Grains from local Braj farmers, vegetables from our own kitchen garden, milk from a single Gaushala outside Mathura." },
  { icon: Flame, title: "Cooked with Prayers", body: "Every meal begins with a kitchen aarti at 5:30 AM. The head chef offers the first portion to Krishna before service begins." },
  { icon: Droplets, title: "Filtered Yamuna Water", body: "Triple-filtered, UV-purified water used for cooking — never bottled plastic. The same water the priests use for temple abhishek." },
];

const FULL_MENU = [
  {
    section: "Breakfast (7:00 – 10:30 AM)",
    items: [
      { name: "Satvik Puri-Sabzi", desc: "Puffed whole-wheat puris with slow-cooked potato-tomato sabzi. The Banke Bihari breakfast.", price: "₹380", veg: true },
      { name: "Makhan Mishri Prasadam", desc: "Fresh-churned white butter with crystal sugar — Krishna's favourite, served at sunrise.", price: "₹240", veg: true },
      { name: "Aloo Paratha with Curd", desc: "Two stuffed parathas with fresh curd, pickle and a small portion of fruit.", price: "₹320", veg: true },
      { name: "Seasonal Fruit Thali", desc: "Five seasonal fruits with honey, soaked almonds and tulsi tea.", price: "₹290", veg: true },
    ],
  },
  {
    section: "Lunch (12:30 – 3:00 PM)",
    items: [
      { name: "Braj Thali", desc: "Seven seasonal preparations on a heritage brass plate — chapati, rice, two sabzis, dal, kadhi, sweet.", price: "₹650", veg: true },
      { name: "Satvik Thali (Light)", desc: "Five preparations — phulka, rice, one sabzi, dal, sweet. For devotees observing a lighter fast.", price: "₹480", veg: true },
      { name: "Paneer Makhanwala", desc: "Cottage cheese in a mild tomato-cashew gravy with butter. Served with phulka and rice.", price: "₹520", veg: true },
      { name: "Bharwan Baingan", desc: "Baby eggplants stuffed with spiced peanut-coconut masala. A Braj specialty.", price: "₹420", veg: true },
    ],
  },
  {
    section: "Dinner (7:00 – 10:00 PM · Rooftop)",
    items: [
      { name: "Rabri-Jalebi", desc: "Thickened milk rabri from a Braj halwai paired with hot, crisp jalebis. Evening only.", price: "₹320", veg: true },
      { name: "Khichdi-Sabzi (Evening Satvik)", desc: "Moong dal khichdi with ghee-tadka, served with curd and papad. For Ekadashi observers.", price: "₹360", veg: true },
      { name: "Malai Kofta", desc: "Paneer-potato dumplings in a creamy gravy. Served with phulka and jeera rice.", price: "₹480", veg: true },
      { name: "Dal Braj", desc: "Five-lentil dal slow-cooked for four hours with whole spices. A RK Residency signature.", price: "₹380", veg: true },
    ],
  },
  {
    section: "Beverages",
    items: [
      { name: "Tulsi Tea", desc: "Tulsi leaves from our garden with ginger and raw honey. Devotional and immunity-boosting.", price: "₹90", veg: true },
      { name: "Thandai (Seasonal)", desc: "Milk with almonds, fennel, cardamom and rose petals. Holi specialty.", price: "₹180", veg: true },
      { name: "Aam Panna (Summer)", desc: "Raw mango cooler with mint and black salt. Made fresh daily.", price: "₹140", veg: true },
      { name: "Lassi (Sweet/Salted)", desc: "Thick yoghurt drink from our Gaushala milk. Sweetened with mishri or salted with cumin.", price: "₹120", veg: true },
    ],
  },
];

export function DiningPage() {
  return (
    <PageShell
      title="Food as prasadam, not just sustenance"
      subtitle="Our kitchen follows the strict satvik tradition of Braj — no onion, no garlic, no eggs. Every meal is prepared after a kitchen aarti and served as prasadam. The rooftop dining pavilion overlooks the Yamuna and serves dinner under candlelight."
      accent="marsala"
    >
      {/* Hero image */}
      <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
        <img
          src="/images/satvik-dining.jpg"
          alt="Satvik thali on a heritage brass plate at RK Residency"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
          <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
            Rooftop Yamuna Pavilion
          </div>
          <div className="font-serif text-2xl">Dinner under candlelight, 7 PM – 10 PM</div>
        </div>
      </div>

      {/* Principles */}
      <div className="mb-16">
        <div className="mb-8 text-center">
          <Lotus size={20} className="mx-auto mb-2 text-gold" />
          <h2 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            The four principles of our kitchen
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="group h-full rounded-2xl border border-charcoal/10 bg-white p-5 transition-all hover:border-gold/40 hover:shadow-lg">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-teal/8 text-teal transition-colors group-hover:bg-teal group-hover:text-ivory">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-charcoal">{p.title}</h3>
                <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Full menu */}
      <div>
        <SectionDivider className="mb-10" />
        <div className="mb-8 flex items-center justify-center gap-2 text-gold-deep">
          <Clock className="h-4 w-4" />
          <span className="font-display text-xs uppercase tracking-[0.32em]">Full Menu</span>
        </div>

        <div className="space-y-10">
          {FULL_MENU.map((sec) => (
            <Reveal key={sec.section}>
              <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                <div className="border-b border-charcoal/10 bg-teal px-6 py-4">
                  <h3 className="font-serif text-xl font-semibold text-gold-soft">
                    {sec.section}
                  </h3>
                </div>
                <div className="divide-y divide-charcoal/8">
                  {sec.items.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-4 p-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-teal" />
                          <h4 className="font-serif text-base font-semibold text-charcoal">{item.name}</h4>
                        </div>
                        <p className="mt-1.5 max-w-xl font-display text-sm leading-relaxed text-charcoal-soft">
                          {item.desc}
                        </p>
                      </div>
                      <div className="shrink-0 font-serif text-lg font-bold text-marsala">
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
          <p className="font-display text-sm text-charcoal-soft">
            All meals are inclusive of 5% GST. Satvik fasting menus available on request for
            Ekadashi, Janmashtami and other vrat days. Our chef is happy to customize for Jain,
            vegan and gluten-free diets — please mention at booking.
          </p>
        </div>
      </div>

      {/* In-room dining */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {[
          { icon: HandPlatter, title: "In-room dining", body: "7 AM – 10 PM. Full menu available. Hot food delivered on heritage brass thalis." },
          { icon: Sparkles, title: "Private satsang catering", body: "Up to 20 guests. Custom satvik menu prepared by the head chef. Book 48 hours in advance." },
          { icon: Flower2, title: "Festival feasts", body: "Janmashtami midnight bhog, Holi gujiya-thandai, Radhashtami chhappan bhog — by reservation only." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-charcoal/10 bg-white p-5">
            <c.icon className="h-6 w-6 text-marsala" />
            <h3 className="mt-3 font-serif text-base font-semibold text-charcoal">{c.title}</h3>
            <p className="mt-1.5 font-display text-sm text-charcoal-soft">{c.body}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
