"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useContactInfo } from "@/lib/use-contact-info";

export type LegalSection = {
  id: string;
  number?: string;
  title: string;
  body: React.ReactNode;
};

export type LegalPageProps = {
  title: string;
  subtitle: string;
  accent?: "teal" | "gold" | "marsala";
  intro?: React.ReactNode;
  sections: LegalSection[];
  closing?: React.ReactNode;
  effectiveDate?: string;
};

/**
 * LegalPage — shared layout for /privacy-policy, /terms-and-conditions,
 * and /cancellation-policy. Uses the existing PageShell + Reveal + Lotus
 * motifs so it visually matches every other inner page on the site
 * (About, Contact, Blog list, etc.). No new styles introduced.
 *
 * Layout: sticky TOC on the left (lg+), main content on the right.
 * Active section is highlighted as the user scrolls (IntersectionObserver).
 */
export function LegalPage({
  title,
  subtitle,
  accent = "teal",
  intro,
  sections,
  closing,
  effectiveDate,
}: LegalPageProps) {
  const info = useContactInfo();
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  // Track which section is in view to highlight in the TOC.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <PageShell title={title} subtitle={subtitle} accent={accent}>
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Sticky table of contents (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gold-deep">
                <Lotus size={16} />
                <span className="font-display text-[10px] uppercase tracking-[0.28em]">
                  Contents
                </span>
              </div>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left font-display text-xs transition-colors ${
                      activeId === s.id
                        ? "bg-teal/10 font-semibold text-teal"
                        : "text-charcoal-soft hover:bg-ivory-deep hover:text-charcoal"
                    }`}
                  >
                    {s.number ? `${s.number}. ` : ""}{s.title}
                  </button>
                ))}
              </nav>
              {effectiveDate && (
                <div className="mt-4 border-t border-charcoal/10 pt-3">
                  <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                    Effective
                  </p>
                  <p className="mt-0.5 font-serif text-sm font-semibold text-charcoal">
                    {effectiveDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main legal content */}
        <div className="min-w-0">
          {intro && (
            <Reveal>
              <div className="mb-10 rounded-3xl border border-teal/20 bg-teal/5 p-6 sm:p-8">
                <Lotus size={24} className="mb-3 text-gold" />
                <div className="font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
                  {intro}
                </div>
              </div>
            </Reveal>
          )}

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <Reveal key={section.id} delay={idx * 0.02}>
                <section
                  id={section.id}
                  className="scroll-mt-24 border-l-2 border-gold/30 pl-5 sm:pl-8"
                >
                  <h2 className="font-serif text-xl font-semibold text-charcoal sm:text-2xl">
                    {section.number && (
                      <span className="mr-2 text-gold-deep">{section.number}.</span>
                    )}
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3 font-display text-sm leading-relaxed text-charcoal-soft sm:text-base">
                    {section.body}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>

          {closing && (
            <Reveal>
              <div className="mt-12 rounded-3xl border border-marsala/20 bg-marsala/5 p-6 sm:p-8">
                <div className="font-display text-base leading-relaxed text-charcoal-soft">
                  {closing}
                </div>
              </div>
            </Reveal>
          )}

          {/* Contact card */}
          <Reveal>
            <div className="mt-10 rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-3 flex items-center gap-2 text-gold-deep">
                <Lotus size={18} />
                <span className="font-display text-[10px] uppercase tracking-[0.28em]">
                  Contact us
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-charcoal">
                Questions about this policy?
              </h3>
              <p className="mt-2 font-display text-sm text-charcoal-soft">
                Our concierge team is happy to clarify any clause. Reach out — we reply within 4 hours.
              </p>
              <div className="mt-4 grid gap-2 font-display text-sm sm:grid-cols-2">
                <a
                  href={info.telUrl}
                  className="flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 font-semibold text-teal transition-colors hover:bg-teal hover:text-ivory"
                >
                  📞 {info.phoneDisplay}
                </a>
                <a
                  href={info.mailtoUrl}
                  className="flex items-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 font-semibold text-teal transition-colors hover:bg-teal hover:text-ivory"
                >
                  ✉️ {info.emailPrimary}
                </a>
              </div>
              <p className="mt-3 font-display text-xs text-charcoal-soft">
                📍 {info.addressFull}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </PageShell>
  );
}

/* ---------- Tiny presentational helpers used inside sections ---------- */

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
      <span>{children}</span>
    </div>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <Bullet key={i}>{it}</Bullet>
      ))}
    </div>
  );
}

export function Callout({ children, variant = "note" }: { children: React.ReactNode; variant?: "note" | "warning" }) {
  const cls = variant === "warning"
    ? "border-marsala/30 bg-marsala/5 text-marsala"
    : "border-gold/30 bg-gold/5 text-gold-deep";
  return (
    <div className={`rounded-xl border px-4 py-3 font-display text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function PolicyTable({ rows }: { rows: { time: string; charge: string }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal/10">
      <table className="w-full text-left">
        <thead className="bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
          <tr>
            <th className="px-4 py-3">Cancellation Time</th>
            <th className="px-4 py-3">Charges</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/8 font-display text-sm">
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-ivory-deep/30"}>
              <td className="px-4 py-3 text-charcoal">{r.time}</td>
              <td className="px-4 py-3 font-semibold text-teal">{r.charge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
