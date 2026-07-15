"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, MapPin, Phone, Send, Loader2, Facebook, Instagram, Youtube,
  ShieldCheck, BadgeCheck, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, Lotus } from "./Motifs";
import { toast } from "sonner";

const NAV_GROUPS = [
  {
    title: "Stay",
    links: [
      { label: "Rooms & Suites", href: "/rooms" },
      { label: "Vrindavan Experiences", href: "/experiences" },
      { label: "Satvik Dining", href: "/dining" },
      { label: "Amenities", href: "/#amenities" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Offers & Packages", href: "/offers" },
      { label: "Festival Calendar", href: "/festivals" },
      { label: "Guest Reviews", href: "/#testimonials" },
      { label: "Contact & Location", href: "/contact" },
      { label: "Braj Journal", href: "/blog" },
      { label: "Our Story", href: "/about" },
    ],
  },
];

const SOCIAL = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
];

const TRUST = [
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: BadgeCheck, label: "Best price guarantee" },
  { icon: Globe, label: "EN / हिंदी" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Invalid email", { description: "Please enter a valid email address." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      toast.success("Welcome to the RK Residency circle", {
        description: "Watch your inbox for festival calendars and member offers.",
      });
      setEmail("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Subscription failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative mt-auto bg-charcoal text-ivory">
      {/* Top decorative gold line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Newsletter band */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-gold-soft">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Stay in the circle
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold sm:text-3xl">
              Festival calendars, member offers &amp; Braj stories
            </h3>
            <p className="mt-2 font-display text-sm text-ivory/70">
              One email a fortnight. Never spam. Unsubscribe anytime.
            </p>
          </div>
          <form onSubmit={onSubscribe} className="flex w-full flex-col gap-3 sm:flex-row sm:items-start">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/50" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-ivory/20 bg-ivory/5 pl-10 text-ivory placeholder:text-ivory/40 focus-visible:ring-gold"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="cta-glow rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-6 py-3 font-semibold text-charcoal hover:from-gold-deep hover:to-gold disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" />
                  Subscribe
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold">
                <Logo size={22} />
              </span>
              <div>
                <div className="font-serif text-lg font-semibold text-ivory">RK Residency</div>
                <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                  Vrindavan · Braj
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm font-display text-sm leading-relaxed text-ivory/70">
              A heritage-luxury residency on the banks of the Yamuna, welcoming
              pilgrims and devotee families since 2014. <em>A guest is a visiting deity.</em>
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-ivory/15 text-ivory/80 transition-all hover:border-gold hover:bg-gold hover:text-charcoal"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map((g) => (
            <div key={g.title}>
              <h4 className="mb-4 font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
                {g.title}
              </h4>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-display text-sm text-ivory/75 transition-colors hover:text-gold-soft focus-ring"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
              Reach us
            </h4>
            <ul className="space-y-3 font-display text-sm text-ivory/75">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <a href="tel:+915652345678" className="transition-colors hover:text-gold-soft">
                  +91 565 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <a href="mailto:stay@rkresidency.in" className="transition-colors hover:text-gold-soft">
                  stay@rkresidency.in
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {TRUST.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1 rounded-full border border-ivory/15 bg-ivory/5 px-2.5 py-1 font-display text-[10px] uppercase tracking-wider text-ivory/70"
                >
                  <t.icon className="h-3 w-3 text-gold-soft" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <div className="font-display text-xs text-ivory/60">
            © {new Date().getFullYear()} RK Residency, Vrindavan. All rights reserved.
          </div>
          <div className="flex items-center gap-4 font-display text-xs text-ivory/60">
            <a href="#" className="transition-colors hover:text-gold-soft">Privacy</a>
            <a href="#" className="transition-colors hover:text-gold-soft">Terms</a>
            <a href="#" className="transition-colors hover:text-gold-soft">Cancellation policy</a>
            <a
              href="/admin"
              className="transition-colors hover:text-gold-soft"
              aria-label="Staff admin login"
            >
              Staff
            </a>
            <span className="hidden sm:inline">· GSTIN 09AAACK1234R1Z5</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
