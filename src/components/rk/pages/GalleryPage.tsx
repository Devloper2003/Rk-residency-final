"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, Filter } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  category: string;
};

const GALLERY: GalleryItem[] = [
  { src: "/images/hero-vrindavan.jpg", alt: "Sunrise over Vrindavan temple skyline", caption: "Sunrise over the temple skyline", category: "Temples" },
  { src: "/images/heritage-room.jpg", alt: "Heritage luxury room with jharokha window", caption: "Yamuna Suite — jharokha window", category: "Rooms" },
  { src: "/images/yamuna-aarti.jpg", alt: "Yamuna aarti at dusk", caption: "Yamuna aarti at Keshi Ghat", category: "Rituals" },
  { src: "/images/satvik-dining.jpg", alt: "Satvik thali on brass plate", caption: "Braj Thali — rooftop dining", category: "Dining" },
  { src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", alt: "Temple architecture detail", caption: "Prem Mandir marble detail", category: "Temples" },
  { src: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1200&q=80", alt: "Marigold and diya offerings", caption: "Marigold & diya — daily offerings", category: "Rituals" },
  { src: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1200&q=80", alt: "ISKCON kirtan", caption: "ISKCON evening kirtan", category: "Temples" },
  { src: "https://images.unsplash.com/photo-1583077874344-53b0e8a7b9ee?auto=format&fit=crop&w=1200&q=80", alt: "Holi festival colours", caption: "Holi at the Braj courtyard", category: "Festivals" },
  { src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80", alt: "Modern hotel room", caption: "Prem Mandir View Room — balcony", category: "Rooms" },
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80", alt: "Suite interior", caption: "Radha Rani Junior Suite", category: "Rooms" },
  { src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", alt: "Banke Bihari Deluxe room", caption: "Banke Bihari Deluxe — courtyard view", category: "Rooms" },
  { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", alt: "Family suite", caption: "Gokul Royal Villa courtyard", category: "Rooms" },
  { src: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80", alt: "Hotel room desk", caption: "Heritage writing desk", category: "Rooms" },
  { src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", alt: "Temple at night", caption: "Prem Mandir night illumination", category: "Temples" },
  { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", alt: "Hotel room interior", caption: "Bansuri Heritage Room — jharokha seat", category: "Rooms" },
];

const CATEGORIES = ["All", "Temples", "Rooms", "Rituals", "Dining", "Festivals"];

export function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [category, setCategory] = useState("All");

  const visible = category === "All" ? GALLERY : GALLERY.filter((g) => g.category === category);

  const close = () => setLightboxIndex(null);
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % visible.length));
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));

  return (
    <PageShell
      title="A glimpse of Braj"
      subtitle="Step inside RK Residency — heritage interiors, the Yamuna ghats, temple rituals and the changing colours of Vrindavan through the year."
      accent="gold"
    >
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-2 inline-flex items-center gap-1 font-display text-xs uppercase tracking-wider text-charcoal-soft">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all focus-ring ${
              category === c
                ? "border-teal bg-teal text-ivory"
                : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40 hover:text-teal"
            }`}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Masonry */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
        {visible.map((item, i) => (
          <Reveal
            key={`${item.caption}-${i}`}
            delay={(i % 6) * 0.04}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-charcoal/10"
          >
            <button
              onClick={() => setLightboxIndex(i)}
              className="block h-full w-full focus-ring"
              aria-label={`Open ${item.caption} in lightbox`}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
              <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ivory/85 text-teal opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
              </div>
              <div className="absolute left-2 top-2 rounded-full bg-charcoal/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ivory backdrop-blur-sm">
                {item.category}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 text-ivory">
                <div className="font-serif text-xs font-semibold sm:text-sm">
                  {item.caption}
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center">
        <Lotus size={18} className="text-gold" />
        <span className="mx-3 font-display text-xs text-charcoal-soft">
          A full 360° virtual tour is available on request — write to stay@rkresidency.in
        </span>
        <Lotus size={18} className="text-gold" />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-charcoal/90 backdrop-blur-md"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-ivory/30 text-ivory hover:bg-ivory/10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory hover:bg-ivory/10 sm:left-6"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory hover:bg-ivory/10 sm:right-6"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative max-h-[88vh] max-w-[90vw] overflow-hidden rounded-2xl border border-gold/30"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={visible[lightboxIndex].src}
                alt={visible[lightboxIndex].alt}
                className="max-h-[78vh] w-full object-contain"
              />
              <div className="bg-gradient-to-t from-charcoal/90 to-transparent px-6 py-4">
                <div className="font-serif text-lg text-ivory">{visible[lightboxIndex].caption}</div>
                <div className="mt-1 font-display text-xs uppercase tracking-wider text-gold-soft">
                  {visible[lightboxIndex].category} · {lightboxIndex + 1} / {visible.length}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
