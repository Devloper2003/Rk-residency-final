"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter, routeHref } from "@/lib/router";
import { Logo, SectionDivider } from "./Motifs";

/**
 * Full-screen page wrapper for the in-app router. Renders above the home
 * page with a sticky top bar containing back/home buttons + the page title.
 */
export function PageShell({
  title,
  subtitle,
  children,
  accent = "teal",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "teal" | "gold" | "marsala";
}) {
  const navigate = useRouter((s) => s.navigate);

  const accentBg =
    accent === "gold"
      ? "bg-gradient-to-r from-gold-soft/10 via-gold/5 to-transparent"
      : accent === "marsala"
      ? "bg-gradient-to-r from-marsala/10 via-marsala/5 to-transparent"
      : "bg-gradient-to-r from-teal/8 via-teal/4 to-transparent";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-ivory scrollbar-thin"
      role="main"
    >
      {/* Sticky top bar */}
      <div className={`sticky top-0 z-10 ${accentBg} border-b border-charcoal/10 backdrop-blur-md`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-soft transition-all hover:border-teal hover:bg-teal hover:text-ivory focus-ring"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
            <a
              href={routeHref("home")}
              onClick={(e) => {
                e.preventDefault();
                navigate("home");
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 bg-white text-teal transition-all hover:bg-teal hover:text-ivory focus-ring"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-ivory text-teal">
              <Logo size={18} />
            </span>
            <span className="font-display text-[10px] uppercase tracking-[0.28em] text-charcoal-soft">
              RK Residency · Vrindavan
            </span>
          </div>
        </div>
      </div>

      {/* Hero header */}
      <header className={`relative overflow-hidden ${accentBg} pb-8 pt-12`}>
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

      {/* Footer credit */}
      <footer className="border-t border-charcoal/10 bg-ivory-deep py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-display text-xs text-charcoal-soft">
            © {new Date().getFullYear()} RK Residency, Vrindavan ·
            <a
              href={routeHref("contact")}
              onClick={(e) => {
                e.preventDefault();
                navigate("contact");
              }}
              className="ml-1 text-teal hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
