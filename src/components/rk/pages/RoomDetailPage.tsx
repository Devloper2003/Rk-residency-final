"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Maximize, BedDouble, Eye, Sparkles, Check, ArrowRight,
  CalendarDays, ShieldCheck, Wifi, Snowflake, Coffee, Bell,
  MapPin, Star, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { PageShell } from "../PageShell";
import { Button } from "@/components/ui/button";
import { Reveal, Lotus, PeacockFeather } from "../Motifs";
import { AvailabilityCalendar } from "../AvailabilityCalendar";
import { useRouter } from "@/lib/router";
import { useContactInfo } from "@/lib/use-contact-info";
import { useContentValue } from "@/lib/site-content";

type Room = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  basePrice: number;
  maxGuests: number;
  sizeSqft: number;
  bedType: string;
  view: string;
  imageUrls: string;
  amenities: string;
  totalCount: number;
  badge: string | null;
};

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Complimentary Wi-Fi": Wifi,
  "Air conditioning": Snowflake,
  "Espresso machine": Coffee,
  "Daily housekeeping": Sparkles,
  "Brass diya turn-down ritual": Bell,
};

export function RoomDetailPage({ slug }: { slug: string }) {
  const navigate = useRouter((s) => s.navigate);
  const openBooking = useRouter((s) => s.openBooking);
  const info = useContactInfo();
  // Use check-in/out times from site settings (via useContactInfo) — same source
  // as every other component. Previous code used useContentValue which reads from
  // a different API and had a different default ("12:00 PM" vs "2:00 PM").
  const checkinTime = info.checkinTime;
  const checkoutTime = info.checkoutTime;
  const [room, setRoom] = useState<Room | null>(null);
  const [related, setRelated] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const found = (data.rooms as Room[]).find((r) => r.slug === slug);
        setRoom(found || null);
        setActiveImage(0);
        setRelated((data.rooms as Room[]).filter((r) => r.slug !== slug).slice(0, 3));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (!room) {
    return (
      <PageShell title="Room not found" subtitle="The room you're looking for doesn't exist.">
        <Button onClick={() => navigate("rooms")}>Browse all rooms</Button>
      </PageShell>
    );
  }

  const images: string[] = (() => { try { return JSON.parse(room.imageUrls || "[]"); } catch { return []; } })();
  const amenities: string[] = (() => { try { return JSON.parse(room.amenities || "[]"); } catch { return []; } })();
  const gallery = images.length > 0 ? images : ["/images/heritage-room.webp"];

  const nextImage = () => setActiveImage((i) => (i + 1) % gallery.length);
  const prevImage = () => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);

  return (
    <PageShell title={room.name} subtitle={room.tagline} accent="teal">
      {/* ===== HERO GALLERY — Full-width immersive ===== */}
      <div className="mb-8 overflow-hidden rounded-3xl shadow-2xl">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-charcoal sm:aspect-[16/8]">
          <motion.img
            key={activeImage}
            src={gallery[activeImage]}
            alt={`${room.name} — view ${activeImage + 1}`}
            initial={{ opacity: 0.5, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="h-full w-full cursor-zoom-in object-cover"
            onClick={() => setLightboxOpen(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-charcoal/20" />

          {/* Badge */}
          {room.badge && (
            <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-teal/85 px-4 py-1.5 text-sm font-semibold text-ivory backdrop-blur-sm">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-gold-soft" />
              {room.badge}
            </div>
          )}

          {/* Image counter */}
          {gallery.length > 1 && (
            <div className="absolute right-4 top-4 rounded-full bg-charcoal/60 px-3 py-1 text-xs font-medium text-ivory backdrop-blur-sm">
              {activeImage + 1} / {gallery.length}
            </div>
          )}

          {/* Nav arrows */}
          {gallery.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/20 text-ivory backdrop-blur-md transition-all hover:bg-ivory/40" aria-label="Previous image">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={nextImage} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/20 text-ivory backdrop-blur-md transition-all hover:bg-ivory/40" aria-label="Next image">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Bottom overlay with room name */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-gold-soft">
                  <MapPin className="h-4 w-4" />
                  <span className="font-display text-xs uppercase tracking-[0.2em]">{room.view}</span>
                </div>
                <h1 className="font-serif text-3xl font-bold text-ivory sm:text-4xl lg:text-5xl">{room.name}</h1>
                <p className="mt-1 font-display text-sm text-ivory/80">{room.tagline}</p>
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-ivory/15 px-5 py-3 text-right backdrop-blur-md sm:block">
                <div className="font-serif text-2xl font-bold text-ivory">₹{room.basePrice.toLocaleString("en-IN")}</div>
                <div className="font-display text-[10px] uppercase tracking-wider text-ivory/70">per night</div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-charcoal p-3 scrollbar-thin">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  activeImage === i ? "border-gold opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== QUICK SPECS BAR ===== */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { icon: Users, label: "Guests", value: `${room.maxGuests}` },
          { icon: Maximize, label: "Size", value: `${room.sizeSqft} sq.ft` },
          { icon: BedDouble, label: "Bed", value: room.bedType },
          { icon: Eye, label: "View", value: room.view },
          { icon: Star, label: "Available", value: `${room.totalCount} rooms` },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal/8 text-teal">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-sm font-bold text-charcoal">{s.value}</div>
              <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: Description + Amenities + Policies */}
        <div className="space-y-8">
          {/* Description */}
          <Reveal>
            <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
              <PeacockFeather size={60} className="pointer-events-none mb-3 -ml-2 text-teal/15" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal">About this room</h2>
              <p className="mt-4 font-display text-base leading-relaxed text-charcoal-soft">{room.longDescription}</p>
            </div>
          </Reveal>

          {/* Amenities */}
          <Reveal>
            <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-5 font-serif text-xl font-semibold text-charcoal">Amenities &amp; inclusions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a];
                  return (
                    <div key={a} className="flex items-center gap-3 rounded-xl bg-ivory-deep/40 p-3 transition-colors hover:bg-ivory-deep/70">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/8 text-teal">
                        {Icon ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </span>
                      <span className="font-display text-sm font-medium text-charcoal">{a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Availability Calendar */}
          <Reveal>
            <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-5 font-serif text-xl font-semibold text-charcoal">Availability — next 90 days</h2>
              <AvailabilityCalendar roomId={room.id} totalCount={room.totalCount} onBookClick={() => openBooking(room.slug)} />
            </div>
          </Reveal>

          {/* Policies */}
          <Reveal>
            <div className="rounded-3xl border border-gold/30 bg-gold/5 p-6 sm:p-8">
              <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Good to know</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  `Check-in ${checkinTime} · Check-out ${checkoutTime}`,
                  "Free cancellation up to 72 hours before check-in",
                  "Daily satvik breakfast included for all guests",
                  "Children under 6 stay free with existing bedding",
                  "5% GST and ₹250/night service fee included",
                  "Festival surge pricing during Janmashtami, Holi & Radhashtami",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 font-display text-sm text-charcoal-soft">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: Sticky Booking Card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-xl">
            {/* Price header */}
            <div className="bg-gradient-to-br from-teal to-teal-deep p-6 text-ivory">
              <div className="font-display text-xs uppercase tracking-wider text-ivory/70">Starting from</div>
              <div className="mt-1 font-serif text-4xl font-bold">
                ₹{room.basePrice.toLocaleString("en-IN")}
                <span className="ml-1 font-sans text-sm font-normal text-ivory/70">/ night</span>
              </div>
              <div className="mt-1 font-display text-xs text-ivory/60">Inclusive of breakfast · {room.totalCount} rooms available</div>
            </div>

            {/* Body */}
            <div className="p-6">
              <Button
                onClick={() => openBooking(room.slug)}
                className="cta-glow w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3.5 font-serif text-base font-semibold text-charcoal shadow-lg hover:from-gold-deep hover:to-gold"
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                Check availability
              </Button>

              <div className="mt-5 space-y-3 border-t border-charcoal/10 pt-5">
                {[
                  "Free cancellation 72h before check-in",
                  "Best price guarantee — no OTA commission",
                  "Pay at hotel option available",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 font-display text-xs text-charcoal-soft">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                    {t}
                  </div>
                ))}
              </div>

              <a
                href={info.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/5 py-2.5 font-display text-xs font-semibold text-[#1a7d3a] transition-colors hover:bg-[#25D366]/10"
              >
                Ask on WhatsApp instead
              </a>

              {/* Contact mini-card */}
              <div className="mt-5 rounded-2xl bg-ivory-deep/40 p-4 text-center">
                <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Need help?</div>
                <a href={info.telUrl} className="mt-1 block font-serif text-sm font-bold text-teal hover:underline">{info.phoneDisplay}</a>
                <a href={info.mailtoUrl} className="block font-display text-xs text-charcoal-soft hover:underline">{info.emailPrimary}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RELATED ROOMS ===== */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-center">
            <Lotus size={18} className="text-gold" />
            <span className="mx-3 font-display text-xs uppercase tracking-[0.32em] text-gold-deep">You may also like</span>
            <Lotus size={18} className="text-gold" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => {
              const relImgs: string[] = (() => { try { return JSON.parse(r.imageUrls || "[]"); } catch { return []; } })();
              return (
                <Reveal key={r.id} delay={i * 0.06}>
                  <button
                    onClick={() => navigate("room-detail", r.slug)}
                    className="group block w-full overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={relImgs[0] || "/images/heritage-room.webp"}
                        alt={r.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="font-display text-[10px] uppercase tracking-wider text-gold-soft">{r.view}</div>
                        <div className="font-serif text-lg font-semibold text-ivory">{r.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="font-serif text-lg font-bold text-teal">
                        ₹{r.basePrice.toLocaleString("en-IN")}
                        <span className="font-sans text-xs font-normal text-charcoal-soft"> / night</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-display text-xs font-semibold text-teal">
                        View <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== STICKY MOBILE BOOKING BAR ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-serif text-lg font-bold text-teal">
              ₹{room.basePrice.toLocaleString("en-IN")}
              <span className="font-sans text-xs font-normal text-charcoal-soft"> / night</span>
            </div>
            <div className="font-display text-[10px] text-charcoal-soft">{room.totalCount} rooms · Free cancellation</div>
          </div>
          <Button
            onClick={() => openBooking(room.slug)}
            className="cta-glow rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-6 py-2.5 font-serif text-sm font-semibold text-charcoal"
          >
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-charcoal/95 backdrop-blur-sm" onClick={() => setLightboxOpen(false)}>
          <button className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20" onClick={() => setLightboxOpen(false)}>
            <X className="h-6 w-6" />
          </button>
          <button className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img src={gallery[activeImage]} alt="" className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ivory/10 px-4 py-1.5 text-sm text-ivory">
            {activeImage + 1} / {gallery.length}
          </div>
        </div>
      )}
    </PageShell>
  );
}
