"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, Filter } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useContactInfo } from "@/lib/use-contact-info";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  category: string;
};

const GALLERY: GalleryItem[] = [
  { src: "/uploads/77c2e9079bcad2e4.webp", alt: "Sunrise over Vrindavan temple skyline", caption: "Sunrise over the temple skyline", category: "Temples" },
  { src: "/uploads/5b87a4725175feac.webp", alt: "RK residency vrindavan", caption: "RK Residency ", category: "Rooms" },
  { src: "/uploads/63e4076580ba26bc.webp", alt: "Yamuna aarti at dusk", caption: "Yamuna aarti at Keshi Ghat", category: "Rituals" },
  { src: "/uploads/7ff0f47ff2a66e6b.webp", alt: "Satvik thali on brass plate", caption: "Braj Thali — rooftop dining", category: "Dining" },
  { src: "/uploads/602dc906088e4031.webp?auto=format&fit=crop&w=1200&q=80", alt: "Temple architecture detail", caption: "Prem Mandir marble detail", category: "Temples" },
  { src: "/uploads/e120b636d3572317.webp?auto=format&fit=crop&w=1200&q=80", alt: "Marigold and diya offerings", caption: "Marigold & diya — daily offerings", category: "Rituals" },
  { src: "/uploads/59eababd45bb5dda.webp?auto=format&fit=crop&w=1200&q=80", alt: "ISKCON kirtan", caption: "ISKCON evening kirtan", category: "Temples" },
  { src: "/uploads/430045b2d369a607.webp?auto=format&fit=crop&w=1200&q=80", alt: "Holi festival colours", caption: "Holi at the Braj courtyard", category: "Festivals" },
  { src: "/uploads/af2e8feb184ff8c2.webp?auto=format&fit=crop&w=1200&q=80", alt: "Boat Festival", caption: "Boat Festival Iskon Temple", category: "Festivals" },
  { src: "/uploads/e38ce58bc7bd3dbb.webp?auto=format&fit=crop&w=1200&q=80", alt: "Yamuna view", caption: "Yamuna view - flying birds", category: "Temples" },
  { src: "/uploads/3c15d4a30a5b3073.webp?auto=format&fit=crop&w=1200&q=80", alt: "Banke Bihari Mandi", caption: "Banke Bihari Mandir — Gate view", category: "Temples" },
  { src: "/uploads/d8278639f939d1d5.webp?auto=format&fit=crop&w=1200&q=80", alt: "Iskon Temple", caption: "Iskon temple vrindavan", category: "Temples" },
  { src: "/uploads/430045b2d369a607.webp?auto=format&fit=crop&w=1200&q=80", alt: "Braj Holi", caption: "Vrindavan - Braj Holi ", category: "Festivals" },
  { src: "/uploads/ce4bce1d00cb8882.webp?auto=format&fit=crop&w=1200&q=80", alt: "Temple at night", caption: "Prem Mandir night illumination", category: "Temples" },
  { src: "/uploads/4eb433665c6fa58f.webp?auto=format&fit=crop&w=1200&q=80", alt: "Shree Ladli Ji Sarkar", caption: "Radha Rani Temple Barsana ", category: "Temples" },
];

const CATEGORIES = ["All", "Temples", "Rooms", "Rituals", "Dining", "Festivals"];

export function GalleryPage() {
  const info = useContactInfo();
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
      title="The Timeless Beauty of Braj"
      subtitle="Every photograph tells a story of comfort, devotion, and heartfelt hospitality in the sacred city of Vrindavan."
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
          A full 360° virtual tour is available on request — write to <a href={info.mailtoUrl} className="text-teal underline-offset-2 hover:underline">{info.emailPrimary}</a>
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
