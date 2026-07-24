"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { useContactInfo } from "@/lib/use-contact-info";
import { useContentValue, parseJsonArray } from "@/lib/site-content";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  span?: "tall" | "wide" | "square";
};

const GALLERY: GalleryItem[] = [
  {
    src: "/uploads/77c2e9079bcad2e4.webp",
    alt: "Golden-hour Vrindavan temple skyline from Prem mandir",
    caption: "Sunrise over the temple skyline",
    span: "wide",
  },
  {
    src: "/uploads/e7945e7017587391.webp",
    alt: "Historic architecture and temple corridor at Keshi Ghat, Vrindavan",
    caption: "Yamuna Side — kesi ghat",
    span: "tall",
  },
  {
    src: "/uploads/bc1472b2bdcf41a1.webp",
    alt: "Yamuna aarti at dusk with floating diyas",
    caption: "Yamuna aarti at Keshi Ghat",
    span: "square",
  },
  {
    src: "/uploads/7ff0f47ff2a66e6b.webp",
    alt: "Satvik thali on a heritage brass plate",
    caption: "Braj Thali ",
    span: "square",
  },
  {
    src: "/uploads/602dc906088e4031.webp?auto=format&fit=crop&w=1200&q=80",
    alt: "Temple architecture detail in Vrindavan",
    caption: "Prem Mandir marble detail",
    span: "wide",
  },
  {
    src: "/uploads/63e4076580ba26bc.webp?auto=format&fit=crop&w=1200&q=80",
    alt: "Marigold garland and diya offerings",
    caption: "Marigold & diya — daily offerings",
    span: "tall",
  },
  {
    src: "/uploads/59eababd45bb5dda.webp?auto=format&fit=crop&w=1200&q=80",
    alt: "ISKCON temple kirtan scene",
    caption: "ISKCON evening kirtan",
    span: "square",
  },
  {
    src: "/uploads/430045b2d369a607.webp?auto=format&fit=crop&w=1200&q=80",
    alt: "Festival of Holi with gulal colours",
    caption: "Holi at the Braj courtyard",
    span: "square",
  },
];

const SPAN_CLASSES: Record<NonNullable<GalleryItem["span"]>, string> = {
  tall: "sm:row-span-2",
  wide: "sm:col-span-2",
  square: "",
};

export function Gallery() {
  const info = useContactInfo();
  const galleryRaw = useContentValue("gallery.items", "[]");
  const gallery = parseJsonArray<GalleryItem>(galleryRaw, GALLERY);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = () => setLightboxIndex(null);
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));
  const prev = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + gallery.length) % gallery.length
    );

  return (
    <section id="gallery" className="relative bg-ivory-deep py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Gallery &amp; Virtual Tour
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              A glimpse of Braj
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Step inside RK Residency — heritage interiors, the Yamuna ghats,
              temple rituals and the changing colours of Vrindavan through the year.
            </p>
          </Reveal>
        </div>

        {/* Masonry grid */}
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:auto-rows-[240px]">
          {gallery.map((item, i) => (
            <Reveal
              key={i}
              delay={(i % 4) * 0.05}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-charcoal/10 ${SPAN_CLASSES[item.span || "square"]}`}
              y={20}
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
                <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ivory/85 text-teal opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-4 w-4" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                  <div className="font-serif text-sm font-semibold sm:text-base">
                    {item.caption}
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {/* Footer note */}
        <Reveal delay={0.1}>
          <div className="mt-12">
            <SectionDivider className="mb-6" />
            <p className="text-center font-display text-sm text-charcoal-soft">
              A full 360° virtual tour of every room category is available on request —
              write to <a href={info.mailtoUrl} className="text-teal underline-offset-2 hover:underline">{info.emailPrimary}</a>.
            </p>
          </div>
        </Reveal>
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
            aria-label="Gallery lightbox"
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10 focus-ring"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Prev */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10 focus-ring sm:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            {/* Next */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10 focus-ring sm:right-6"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-h-[88vh] max-w-[90vw] overflow-hidden rounded-2xl border border-gold/30"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={gallery[lightboxIndex]?.src || GALLERY[0].src}
                alt={gallery[lightboxIndex]?.alt || GALLERY[0].alt}
                className="max-h-[78vh] w-full object-contain"
              />
              <div className="bg-gradient-to-t from-charcoal/90 to-transparent px-6 py-4">
                <div className="font-serif text-lg text-ivory">
                  {gallery[lightboxIndex]?.caption || GALLERY[0].caption}
                </div>
                <div className="mt-1 font-display text-xs uppercase tracking-wider text-gold-soft">
                  {lightboxIndex + 1} / {gallery.length}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
