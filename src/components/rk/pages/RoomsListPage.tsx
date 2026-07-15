"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Maximize, BedDouble, Sparkles, ArrowRight } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useRouter } from "@/lib/router";

type Room = {
  id: string; slug: string; name: string; tagline: string; description: string;
  basePrice: number; maxGuests: number; sizeSqft: number; bedType: string;
  view: string; imageUrls: string; amenities: string; totalCount: number;
  badge: string | null; featured: boolean;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "suite", label: "Suites" },
  { id: "deluxe", label: "Deluxe" },
  { id: "villa", label: "Villa" },
  { id: "view", label: "View Rooms" },
];

function matchFilter(room: Room, filter: string) {
  if (filter === "all") return true;
  if (filter === "suite") return /suite/i.test(room.name);
  if (filter === "deluxe") return /deluxe/i.test(room.name);
  if (filter === "villa") return /villa/i.test(room.name);
  if (filter === "view") return room.badge === "View" || room.badge === "Signature";
  return true;
}

export function RoomsListPage() {
  const navigate = useRouter((s) => s.navigate);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => {
        setRooms(data.rooms || []);
        setLoading(false);
      });
  }, []);

  const visible = rooms.filter((r) => matchFilter(r, filter));

  return (
    <PageShell
      title="Rooms, suites & a private villa"
      subtitle="Each room is individually designed with hand-carved teak, Makrana marble and Braj-region textiles. Tap any room for a full photo gallery, amenities list and direct booking."
      accent="teal"
    >
      {/* Filters */}
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

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[440px] animate-pulse rounded-3xl bg-charcoal/5" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r, i) => {
            const imgs: string[] = JSON.parse(r.imageUrls || "[]");
            const amenities: string[] = JSON.parse(r.amenities || "[]");
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                onClick={() => navigate("room-detail", r.slug)}
                className="group block w-full overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl focus-ring"
              >
                <div className="relative h-64 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imgs[0] || "/images/heritage-room.jpg"})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                  {r.badge && (
                    <div className="absolute left-4 top-4 rounded-full border border-gold/40 bg-teal/85 px-3 py-1 text-xs font-semibold text-ivory backdrop-blur-sm">
                      <Sparkles className="mr-1 inline h-3 w-3 text-gold-soft" />
                      {r.badge}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                    <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
                      {r.view}
                    </div>
                    <h3 className="mt-1 font-serif text-2xl font-semibold">{r.name}</h3>
                    <p className="font-display text-sm text-ivory/80">{r.tagline}</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-ivory px-2 py-2">
                      <Users className="mx-auto h-4 w-4 text-teal" />
                      <div className="mt-1 text-xs font-semibold text-charcoal">{r.maxGuests}</div>
                    </div>
                    <div className="rounded-lg bg-ivory px-2 py-2">
                      <Maximize className="mx-auto h-4 w-4 text-teal" />
                      <div className="mt-1 text-xs font-semibold text-charcoal">{r.sizeSqft}</div>
                    </div>
                    <div className="rounded-lg bg-ivory px-2 py-2">
                      <BedDouble className="mx-auto h-4 w-4 text-teal" />
                      <div className="mt-1 text-xs font-semibold text-charcoal">{r.bedType}</div>
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-charcoal-soft">{r.description}</p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {amenities.slice(0, 2).map((a) => (
                      <span key={a} className="rounded-full bg-marsala/5 px-2.5 py-1 text-[11px] font-medium text-marsala">
                        {a}
                      </span>
                    ))}
                    {amenities.length > 2 && (
                      <span className="rounded-full bg-charcoal/5 px-2.5 py-1 text-[11px] font-medium text-charcoal-soft">
                        +{amenities.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between border-t border-charcoal/10 pt-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-charcoal-soft">From</div>
                      <div className="font-serif text-2xl font-bold text-teal">
                        ₹{r.basePrice.toLocaleString("en-IN")}
                        <span className="ml-1 font-sans text-xs font-normal text-charcoal-soft">/ night</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-teal">
                      View details
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="mt-12 flex items-center justify-center">
        <Lotus size={18} className="text-gold" />
        <span className="mx-3 font-display text-xs text-charcoal-soft">
          All rates include daily satvik breakfast, Wi-Fi &amp; temple-visit assistance
        </span>
        <Lotus size={18} className="text-gold" />
      </div>
    </PageShell>
  );
}
