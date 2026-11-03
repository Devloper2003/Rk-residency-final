"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { routeHref } from "@/lib/router";
import { SectionDivider } from "./Motifs";
import { Navbar } from "./Navbar";
import { breadcrumbJsonLd } from "@/lib/schema-org";

// Stable year for SSR/client hydration; updated on mount.
function useYear() {
  const [y, setY] = useState(2026);
  useEffect(() => { setY(new Date().getFullYear()); }, []);
  return y;
}

/**
 * Full-screen page wrapper for sub-pages. Renders the site-wide Navbar
 * (solid variant) above the page header so every sub-page carries the same
 * header menu as the homepage; the sticky WhatsApp CTA and full footer come
 * from GlobalChrome in the root layout.
 */
export function PageShell({
  title,
  subtitle,
  children,
  accent = "teal",
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "teal" | "gold" | "marsala";
  /** Ordered trail for BreadcrumbList JSON-LD, e.g. [{ name: "Home", path: "/" }, ...] */
  breadcrumbs?: { name: string; path: string }[];
}) {
  const year = useYear();
  const accentBg =
    accent === "gold"
      ? "bg-gradient-to-r from-gold-soft/10 via-gold/5 to-transparent"
      : accent === "marsala"
      ? "bg-gradient-to-r from-marsala/10 via-marsala/5 to-transparent"
      : "bg-gradient-to-r from-teal/8 via-teal/4 to-transparent";

  return (
    <>
      {/* Site-wide header menu — the SAME Navbar as the homepage, in solid
          variant so it reads on light sub-page backgrounds (owner ask: the
          Rooms page must carry the full header menu). Rendered OUTSIDE the
          animated wrapper so its `fixed` positioning is never affected by
          framer-motion transforms. */}
      <Navbar variant="solid" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-ivory scrollbar-thin"
        role="main"
      >
      {/* BreadcrumbList structured data — emitted in the server-rendered HTML */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
        />
      )}

      {/* Hero header — top padding clears the fixed site Navbar above */}
      <header className={`relative overflow-hidden ${accentBg} pb-8 pt-28 sm:pt-32`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-4xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
                {subtitle}
              </p>
            )}
            <div className="mt-6">
              <SectionDivider className="justify-start" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>

      {/* Sticky WhatsApp CTA + footer now come from GlobalChrome (root layout). */}

      {/* Footer credit */}
      <footer className="border-t border-charcoal/10 bg-ivory-deep py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-display text-xs text-charcoal-soft">
            © {year} RK Residency, Vrindavan ·
            <a
              href={routeHref("contact")}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = routeHref("contact");
              }}
              className="ml-1 text-teal hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </footer>
      </motion.div>
    </>
  );
}
