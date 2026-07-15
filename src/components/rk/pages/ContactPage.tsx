"use client";

import { motion } from "framer-motion";
import {
  MapPin, Phone, Mail, Clock, Navigation, MessageCircle,
} from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";

const CONTACT_INFO = [
  { icon: MapPin, label: "Address", lines: ["RK Residency, Parikrama Marg", "Vrindavan, Mathura", "Uttar Pradesh 281121, India"] },
  { icon: Phone, label: "Phone & WhatsApp", lines: ["+91 565 234 5678 (Front desk)", "+91 98765 43210 (Reservations)"] },
  { icon: Mail, label: "Email", lines: ["stay@rkresidency.in", "events@rkresidency.in (satsang & weddings)"] },
  { icon: Clock, label: "Reception", lines: ["Open 24 hours, 7 days", "Check-in 2:00 PM · Check-out 11:00 AM"] },
];

const NEARBY = [
  { name: "Banke Bihari Mandir", dist: "0.6 km", time: "8 min walk" },
  { name: "ISKCON Sri Krishna Balaram", dist: "1.4 km", time: "18 min walk" },
  { name: "Prem Mandir", dist: "2.1 km", time: "25 min walk" },
  { name: "Nidhivan", dist: "0.9 km", time: "12 min walk" },
  { name: "Keshi Ghat (Yamuna Aarti)", dist: "1.1 km", time: "15 min walk" },
  { name: "Mathura Junction (railway)", dist: "12 km", time: "30 min drive" },
  { name: "Agra Airport (Kheria)", dist: "65 km", time: "1.5 hr drive" },
  { name: "Indira Gandhi Intl. (DEL)", dist: "150 km", time: "3 hr drive" },
];

export function ContactPage() {
  return (
    <PageShell
      title="Begin your Braj journey"
      subtitle="Whether you are planning a pilgrimage, a satsang retreat or a small wedding — write to us. Our concierge replies within four hours, 7 AM – 11 PM IST."
      accent="teal"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: contact info + map */}
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACT_INFO.map((c) => (
              <div key={c.label} className="rounded-2xl border border-charcoal/10 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-teal/8 text-teal">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span className="font-serif text-sm font-semibold text-charcoal">{c.label}</span>
                </div>
                <div className="space-y-0.5 font-display text-xs leading-relaxed text-charcoal-soft">
                  {c.lines.map((l) => <div key={l}>{l}</div>)}
                </div>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-charcoal/10 shadow-sm">
            <iframe
              title="RK Residency location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.6950%2C27.5650%2C77.7250%2C27.5850&layer=mapnik&marker=27.5756%2C77.7100"
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-charcoal/10 bg-white px-4 py-3">
              <div className="font-display text-xs text-charcoal-soft">
                Parikrama Marg · Vrindavan · 281121
              </div>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Vrindavan%20Uttar%20Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 font-display text-xs font-semibold text-ivory transition-colors hover:bg-teal-deep"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get directions
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-marsala" />
              <span className="font-serif text-sm font-semibold text-charcoal">
                Distances from RK Residency
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {NEARBY.map((n) => (
                <div key={n.name} className="flex items-center justify-between border-b border-charcoal/5 py-1.5 last:border-0">
                  <div>
                    <div className="font-display text-xs text-charcoal-soft">{n.name}</div>
                    <div className="font-display text-[10px] text-charcoal-soft/70">{n.time}</div>
                  </div>
                  <span className="font-serif text-xs font-semibold text-teal">{n.dist}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 font-serif text-sm font-semibold text-white transition-all hover:shadow-lg"
            >
              <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              Chat on WhatsApp
            </a>
            <a
              href="tel:+915652345678"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3 font-serif text-sm font-semibold text-ivory transition-all hover:bg-teal-deep hover:shadow-lg"
            >
              <Phone className="h-4 w-4 transition-transform group-hover:scale-110" />
              Call front desk
            </a>
          </div>
        </div>

        {/* Right: travel info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-charcoal/10 bg-white p-6">
            <Lotus size={20} className="mb-3 text-gold" />
            <h3 className="font-serif text-xl font-semibold text-charcoal">
              How to reach Vrindavan
            </h3>

            <div className="mt-5 space-y-5">
              <div>
                <div className="font-display text-xs uppercase tracking-wider text-gold-deep">
                  By air
                </div>
                <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">
                  The nearest international airport is Indira Gandhi International (DEL), 150 km
                  away (3-hour drive). We can arrange a private car pickup for ₹4,500. The
                  nearest domestic airport is Agra's Kheria Airport (65 km, 1.5-hour drive).
                </p>
              </div>

              <div>
                <div className="font-display text-xs uppercase tracking-wider text-gold-deep">
                  By rail
                </div>
                <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">
                  Mathura Junction (12 km) is the nearest major railway station, connected to
                  Delhi, Mumbai, Kolkata, Chennai and Varanasi. We arrange complimentary
                  station pickups for stays of 2+ nights. Vrindavan's own small station is a
                  5-minute walk.
                </p>
              </div>

              <div>
                <div className="font-display text-xs uppercase tracking-wider text-gold-deep">
                  By road
                </div>
                <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">
                  Vrindavan is a 2.5-hour drive from Delhi via the Yamuna Expressway. Private
                  cars, taxis and UP State buses run regularly. The expressway exit is
                  Mathura (Exit 314); from there follow signs to Vrindavan (12 km).
                </p>
              </div>

              <div>
                <div className="font-display text-xs uppercase tracking-wider text-gold-deep">
                  Within Vrindavan
                </div>
                <p className="mt-1.5 font-display text-sm leading-relaxed text-charcoal-soft">
                  Most temples are walkable from RK Residency (under 25 minutes). For longer
                  distances — Barsana, Gokul, Goverdhan — we arrange air-conditioned cars
                  with English-speaking drivers. Cycle-rickshaws are available at the gate.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-gold/5 p-6">
            <h3 className="font-serif text-lg font-semibold text-charcoal">
              Best time to visit
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                <div>
                  <div className="font-serif text-sm font-semibold text-charcoal">
                    October – March (peak season)
                  </div>
                  <div className="font-display text-xs text-charcoal-soft">
                    Cool, pleasant weather (8–22 °C). Janmashtami (Aug/Sep) and Holi (Feb/Mar) are the busiest festival windows.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-marsala" />
                <div>
                  <div className="font-serif text-sm font-semibold text-charcoal">
                    April – June (summer)
                  </div>
                  <div className="font-display text-xs text-charcoal-soft">
                    Hot (35–45 °C). Quieter temples, lower rates. Best for serious pilgrims who can manage the heat.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal" />
                <div>
                  <div className="font-serif text-sm font-semibold text-charcoal">
                    July – September (monsoon)
                  </div>
                  <div className="font-display text-xs text-charcoal-soft">
                    Warm with afternoon showers. The Yamuna swells — the aarti is especially moving. Radhashtami falls in this window.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
