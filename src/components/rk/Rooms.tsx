"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Maximize, BedDouble, Eye, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
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
  imageUrls: string; // JSON array
  amenities: string; // JSON array
  totalCount: number;
  badge: string | null;
  featured: boolean;
};

function TiltCard({
  room,
  onBook,
}: {
  room: Room;
  onBook: (room: Room) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [transform, setTransform] = useState("");
  const navigate = useRouter((s) => s.navigate);

  const handleMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = px * 6;
    const rotX = -py * 6;
    setTransform(`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`);
  };

  const handleLeave = () => setTransform("perspective(1000px) rotateX(0) rotateY(0)");

  const images: string[] = JSON.parse(room.imageUrls || "[]");
  const amenities: string[] = JSON.parse(room.amenities || "[]");
  const cover = images[0] || "/images/heritage-room.jpg";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group perspective-1000"
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ transform }}
        className="card-tilt relative overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_8px_40px_-16px_rgba(35,31,28,0.18)] transition-shadow hover:shadow-[0_18px_60px_-16px_rgba(14,76,79,0.35)]"
      >
        {/* Image with arch mask on top */}
        <div className="relative h-72 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${cover})` }}
            role="img"
            aria-label={room.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/30 to-transparent" />

          {/* Badge */}
          {room.badge && (
            <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-teal/85 px-3 py-1 text-xs font-semibold text-ivory backdrop-blur-sm">
              <Sparkles className="mr-1 inline h-3 w-3 text-gold-soft" />
              {room.badge}
            </div>
          )}

          {/* Title overlay */}
          <button
            onClick={() => navigate("room-detail", room.slug)}
            className="absolute inset-x-0 bottom-0 p-5 text-left text-ivory focus-ring"
            aria-label={`View ${room.name} details`}
          >
            <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
              {room.view}
            </div>
            <h3 className="mt-1 font-serif text-2xl font-semibold group-hover:underline">{room.name}</h3>
            <p className="mt-0.5 font-display text-sm text-ivory/80">{room.tagline}</p>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Quick specs */}
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-ivory px-2 py-2">
              <Users className="mx-auto h-4 w-4 text-teal" />
              <div className="mt-1 text-xs font-semibold text-charcoal">{room.maxGuests}</div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-soft">Guests</div>
            </div>
            <div className="rounded-lg bg-ivory px-2 py-2">
              <Maximize className="mx-auto h-4 w-4 text-teal" />
              <div className="mt-1 text-xs font-semibold text-charcoal">{room.sizeSqft}</div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-soft">sq.ft</div>
            </div>
            <div className="rounded-lg bg-ivory px-2 py-2">
              <BedDouble className="mx-auto h-4 w-4 text-teal" />
              <div className="mt-1 text-xs font-semibold text-charcoal">{room.bedType}</div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-soft">Bed</div>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-charcoal-soft">
            {room.description}
          </p>

          {/* Amenities chips (first 3) */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-marsala/5 px-2.5 py-1 text-[11px] font-medium text-marsala"
              >
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="rounded-full bg-charcoal/5 px-2.5 py-1 text-[11px] font-medium text-charcoal-soft">
                +{amenities.length - 3} more
              </span>
            )}
          </div>

          {/* Footer: price + CTA */}
          <div className="flex items-end justify-between border-t border-charcoal/10 pt-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-soft">From</div>
              <div className="font-serif text-2xl font-bold text-teal">
                ₹{room.basePrice.toLocaleString("en-IN")}
                <span className="ml-1 font-sans text-xs font-normal text-charcoal-soft">
                  / night
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => navigate("room-detail", room.slug)}
                className="rounded-full border border-charcoal/15 bg-white px-3 py-2 font-display text-xs font-semibold text-charcoal-soft transition-all hover:border-teal hover:bg-teal hover:text-ivory"
                aria-label={`View ${room.name} details`}
              >
                Details
              </button>
              <Button
                onClick={() => onBook(room)}
                className="group/btn rounded-full bg-teal px-4 py-2 text-sm font-semibold text-ivory transition-all hover:bg-teal-deep"
              >
                Book Now
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

const FILTERS = [
  { id: "all", label: "All Rooms" },
  { id: "suite", label: "Suites" },
  { id: "deluxe", label: "Deluxe" },
  { id: "villa", label: "Villa" },
  { id: "view", label: "View Rooms" },
];

function matchFilter(room: Room, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "suite") return /suite/i.test(room.name);
  if (filter === "deluxe") return /deluxe/i.test(room.name);
  if (filter === "villa") return /villa/i.test(room.name);
  if (filter === "view") return room.badge === "View" || room.badge === "Signature";
  return true;
}

export function Rooms({ onBookRoom }: { onBookRoom: (room: Room) => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useRouter((s) => s.navigate);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visible = rooms.filter((r) => matchFilter(r, filter));

  return (
    <section id="rooms" className="relative bg-ivory-deep py-24 lg:py-32">
      {/* Top decorative marigold divider */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Accommodation
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              Rooms, suites &amp; a private villa
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Each room is individually designed with hand-carved teak, Makrana marble
              and Braj-region textiles. Every category has its own dedicated landing page
              with full amenities — these are the highlights.
            </p>
          </Reveal>
        </div>

        {/* Filters */}
        <Reveal delay={0.12}>
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all focus-ring ${
                  filter === f.id
                    ? "border-teal bg-teal text-ivory shadow-sm"
                    : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40 hover:text-teal"
                }`}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[480px] animate-pulse rounded-3xl bg-charcoal/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => (
              <TiltCard key={r.id} room={r} onBook={onBookRoom} />
            ))}
          </div>
        )}

        {/* View all link */}
        <Reveal delay={0.12}>
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("rooms")}
              className="group inline-flex items-center gap-2 rounded-full border border-teal/40 px-6 py-2.5 font-serif text-sm font-semibold text-teal transition-all hover:bg-teal hover:text-ivory focus-ring"
            >
              View all rooms &amp; full details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </Reveal>

        {/* Bottom note */}
        <Reveal delay={0.15}>
          <div className="mt-12">
            <SectionDivider className="mb-6" />
            <p className="text-center font-display text-sm text-charcoal-soft">
              All rates include daily satvik breakfast, complimentary Wi-Fi &amp; assistance with temple visits.
              <br />
              <span className="text-marsala">
                Festival surge pricing applies during Janmashtami, Holi &amp; Radhashtami.
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export type { Room };
