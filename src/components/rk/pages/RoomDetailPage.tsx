"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Maximize, BedDouble, Eye, Sparkles, Check, ArrowRight,
  CalendarDays, ShieldCheck, Wifi, Snowflake, Coffee, Bell,
} from "lucide-react";
import { PageShell } from "../PageShell";
import { Button } from "@/components/ui/button";
import { Reveal, Lotus, PeacockFeather } from "../Motifs";
import { AvailabilityCalendar } from "../AvailabilityCalendar";
import { useRouter } from "@/lib/router";

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
  const [room, setRoom] = useState<Room | null>(null);
  const [related, setRelated] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const found = (data.rooms as Room[]).find((r) => r.slug === slug);
        setRoom(found || null);
        setActiveImage(0);
        setRelated(
          (data.rooms as Room[])
            .filter((r) => r.slug !== slug)
            .slice(0, 3)
        );
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

  const images: string[] = JSON.parse(room.imageUrls || "[]");
  const amenities: string[] = JSON.parse(room.amenities || "[]");
  const gallery = images.length > 0 ? images : ["/images/heritage-room.jpg"];

  return (
    <PageShell
      title={room.name}
      subtitle={room.tagline}
      accent="teal"
    >
      {/* Hero gallery */}
      <div className="mb-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <motion.div
          key={activeImage}
          initial={{ opacity: 0.4, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[16/10] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl"
        >
          <img
            src={gallery[activeImage]}
            alt={`${room.name} — view ${activeImage + 1}`}
            className="h-full w-full object-cover"
          />
          {room.badge && (
            <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-teal/85 px-3 py-1 text-xs font-semibold text-ivory backdrop-blur-sm">
              <Sparkles className="mr-1 inline h-3 w-3 text-gold-soft" />
              {room.badge}
            </div>
          )}
        </motion.div>
        {/* Thumbnails */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {gallery.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 transition-all ${
                activeImage === i
                  ? "border-gold shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick specs row */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users, label: "Guests", value: room.maxGuests },
          { icon: Maximize, label: "Size", value: `${room.sizeSqft} sq.ft` },
          { icon: BedDouble, label: "Bed", value: room.bedType },
          { icon: Eye, label: "View", value: room.view },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-charcoal/10 bg-white p-4 text-center"
          >
            <s.icon className="mx-auto h-5 w-5 text-teal" />
            <div className="mt-2 font-serif text-base font-semibold text-charcoal">
              {s.value}
            </div>
            <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: description + amenities */}
        <div>
          <PeacockFeather size={80} className="pointer-events-none mb-4 -ml-2 text-teal/15" />
          <h2 className="font-serif text-2xl font-semibold text-charcoal">
            About this room
          </h2>
          <p className="mt-4 font-display text-base leading-relaxed text-charcoal-soft">
            {room.longDescription}
          </p>

          <h3 className="mt-10 font-serif text-xl font-semibold text-charcoal">
            Amenities &amp; inclusions
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {amenities.map((a) => {
              const Icon = AMENITY_ICONS[a];
              return (
                <div
                  key={a}
                  className="flex items-start gap-2 rounded-xl border border-charcoal/10 bg-white p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/8 text-teal">
                    {Icon ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </span>
                  <span className="font-display text-sm text-charcoal-soft">{a}</span>
                </div>
              );
            })}
          </div>

          {/* Policies */}
          <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <h3 className="font-serif text-lg font-semibold text-charcoal">
              Good to know
            </h3>
            <ul className="mt-3 space-y-2 font-display text-sm text-charcoal-soft">
              <li>• Check-in 2:00 PM · Check-out 11:00 AM (late check-out till 2 PM on request)</li>
              <li>• Free cancellation up to 72 hours before check-in</li>
              <li>• Daily satvik breakfast included for all guests</li>
              <li>• Children under 6 stay free with existing bedding</li>
              <li>• 12% GST and ₹250/night service fee included in the displayed total</li>
              <li>• Festival surge pricing applies during Janmashtami, Holi &amp; Radhashtami</li>
            </ul>
          </div>

          {/* Availability Calendar */}
          <div className="mt-10">
            <AvailabilityCalendar
              roomId={room.id}
              totalCount={room.totalCount}
              onBookClick={() => openBooking(room.slug)}
            />
          </div>
        </div>

        {/* Right: sticky booking card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-xl">
            <div className="mb-1 font-display text-xs uppercase tracking-wider text-charcoal-soft">
              Starting from
            </div>
            <div className="font-serif text-4xl font-bold text-teal">
              ₹{room.basePrice.toLocaleString("en-IN")}
              <span className="ml-1 font-sans text-sm font-normal text-charcoal-soft">
                / night
              </span>
            </div>
            <div className="mt-1 font-display text-xs text-charcoal-soft">
              Inclusive of breakfast · {room.totalCount} rooms available
            </div>

            <Button
              onClick={() => openBooking(room.slug)}
              className="cta-glow mt-5 w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3 font-serif text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Check availability
            </Button>

            <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4">
              {[
                "Free cancellation 72h before check-in",
                "Best price guarantee — no OTA commission",
                "Pay at hotel option available",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-start gap-2 font-display text-xs text-charcoal-soft"
                >
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                  {t}
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-full border border-[#25D366]/40 bg-[#25D366]/5 py-2.5 text-center font-display text-xs font-semibold text-[#1a7d3a] transition-colors hover:bg-[#25D366]/10"
            >
              Ask on WhatsApp instead
            </a>
          </div>
        </div>
      </div>

      {/* Related rooms */}
      {related.length > 0 && (
        <div className="mt-20">
          <div className="mb-8 flex items-center justify-center">
            <Lotus size={18} className="text-gold" />
            <span className="mx-3 font-display text-xs uppercase tracking-[0.32em] text-gold-deep">
              You may also like
            </span>
            <Lotus size={18} className="text-gold" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => {
              const relImgs: string[] = JSON.parse(r.imageUrls || "[]");
              return (
                <Reveal key={r.id} delay={i * 0.06}>
                  <button
                    onClick={() => navigate("room-detail", r.slug)}
                    className="group block w-full overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl focus-ring"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${relImgs[0] || "/images/heritage-room.jpg"})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="font-display text-[10px] uppercase tracking-wider text-gold-soft">
                          {r.view}
                        </div>
                        <div className="font-serif text-lg font-semibold text-ivory">
                          {r.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="font-serif text-lg font-bold text-teal">
                        ₹{r.basePrice.toLocaleString("en-IN")}
                        <span className="font-sans text-xs font-normal text-charcoal-soft">
                          {" "}/ night
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-display text-xs font-semibold text-teal">
                        View
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky mobile booking bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-serif text-lg font-bold text-teal">
              ₹{room.basePrice.toLocaleString("en-IN")}
              <span className="font-sans text-xs font-normal text-charcoal-soft"> / night</span>
            </div>
            <div className="font-display text-[10px] text-charcoal-soft">
              {room.totalCount} rooms · Free cancellation
            </div>
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
    </PageShell>
  );
}
