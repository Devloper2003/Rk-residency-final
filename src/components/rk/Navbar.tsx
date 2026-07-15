"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Globe, CalendarDays } from "lucide-react";
import { Logo } from "./Motifs";
import { Button } from "@/components/ui/button";
import { useRouter, type RouteName } from "@/lib/router";

// Each nav item: clicking scrolls to the section on home; if not on home, navigates to dedicated page.
const NAV_ITEMS: { id: string; route: RouteName; label: string; labelHi: string }[] = [
  { id: "rooms", route: "rooms", label: "Rooms", labelHi: "कक्ष" },
  { id: "experiences", route: "experiences", label: "Experiences", labelHi: "अनुभव" },
  { id: "dining", route: "dining", label: "Dining", labelHi: "भोजन" },
  { id: "gallery", route: "gallery", label: "Gallery", labelHi: "गैलरी" },
  { id: "offers", route: "offers", label: "Offers", labelHi: "ऑफर" },
  { id: "contact", route: "contact", label: "Contact", labelHi: "संपर्क" },
];

export function Navbar({ onBookClick }: { onBookClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [activeId, setActiveId] = useState<string>("");
  const navigate = useRouter((s) => s.navigate);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["home", "about", "rooms", "experiences", "dining", "amenities", "gallery", "offers", "testimonials", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNav = (item: { id: string; route: RouteName }) => {
    setMobileOpen(false);
    // Navigate to the dedicated page
    navigate(item.route);
  };

  // Scroll to a section on the home page (used by hero "Explore" buttons)
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goHome = () => {
    setMobileOpen(false);
    navigate("home");
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass shadow-[0_8px_32px_-12px_rgba(35,31,28,0.18)]"
            : "bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          {/* Logo */}
          <button
            onClick={goHome}
            className="group flex items-center gap-2.5 focus-ring rounded-md"
            aria-label="RK Residency home"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-full border transition-all duration-500 ${
                scrolled
                  ? "border-gold/40 bg-ivory/80 text-teal"
                  : "border-white/30 bg-white/10 text-ivory backdrop-blur-md"
              } group-hover:scale-105`}
            >
              <Logo size={24} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span
                className={`font-serif text-lg font-semibold tracking-wide transition-colors ${
                  scrolled ? "text-teal" : "text-ivory"
                }`}
              >
                RK Residency
              </span>
              <span
                className={`font-display text-[10px] uppercase tracking-[0.28em] transition-colors ${
                  scrolled ? "text-gold-deep" : "text-gold-soft"
                }`}
              >
                Vrindavan · Braj
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                  scrolled
                    ? "text-charcoal-soft hover:text-teal"
                    : "text-ivory/85 hover:text-ivory"
                } ${activeId === item.id ? (scrolled ? "text-teal" : "text-ivory") : ""}`}
              >
                {lang === "hi" ? item.labelHi : item.label}
                {activeId === item.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-gold"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
            <button
              onClick={() => navigate("blog")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                scrolled
                  ? "text-charcoal-soft hover:text-teal"
                  : "text-ivory/85 hover:text-ivory"
              }`}
            >
              {lang === "hi" ? "जर्नल" : "Journal"}
            </button>
            <button
              onClick={() => navigate("about")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                scrolled
                  ? "text-charcoal-soft hover:text-teal"
                  : "text-ivory/85 hover:text-ivory"
              }`}
            >
              {lang === "hi" ? "हमारी कहानी" : "About"}
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus-ring sm:flex ${
                scrolled
                  ? "border-charcoal/15 text-charcoal-soft hover:border-teal/40 hover:text-teal"
                  : "border-white/25 text-ivory/85 hover:border-gold/60 hover:text-ivory"
              }`}
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "EN" : "हि"}
            </button>

            {/* Phone (desktop) */}
            <a
              href="tel:+915652345678"
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus-ring md:flex ${
                scrolled
                  ? "border-charcoal/15 text-charcoal-soft hover:border-teal/40 hover:text-teal"
                  : "border-white/25 text-ivory/85 hover:border-gold/60 hover:text-ivory"
              }`}
              aria-label="Call RK Residency"
            >
              <Phone className="h-3.5 w-3.5" />
              +91 565 234 5678
            </a>

            {/* Book CTA */}
            <Button
              onClick={onBookClick}
              className="hidden cta-glow rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-5 py-2 text-sm font-semibold text-charcoal shadow-md hover:from-gold-deep hover:to-gold sm:inline-flex"
            >
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Check Availability
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className={`grid h-10 w-10 place-items-center rounded-full border transition-all lg:hidden focus-ring ${
                scrolled
                  ? "border-charcoal/15 text-charcoal-soft"
                  : "border-white/25 text-ivory"
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-ivory shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-ivory">
                    <Logo size={20} />
                  </span>
                  <span className="font-serif text-lg font-semibold text-teal">RK Residency</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft focus-ring"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className="rounded-lg px-4 py-3 text-left font-serif text-lg text-charcoal transition-colors hover:bg-teal/5 hover:text-teal focus-ring"
                  >
                    {lang === "hi" ? item.labelHi : item.label}
                  </button>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); navigate("blog"); }}
                  className="rounded-lg px-4 py-3 text-left font-serif text-lg text-charcoal transition-colors hover:bg-teal/5 hover:text-teal focus-ring"
                >
                  {lang === "hi" ? "जर्नल" : "Journal"}
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate("about"); }}
                  className="rounded-lg px-4 py-3 text-left font-serif text-lg text-charcoal transition-colors hover:bg-teal/5 hover:text-teal focus-ring"
                >
                  {lang === "hi" ? "हमारी कहानी" : "About"}
                </button>
              </nav>
              <div className="mt-auto border-t border-charcoal/10 px-5 py-4">
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    onBookClick();
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3 font-semibold text-charcoal cta-glow"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Check Availability
                </Button>
                <a
                  href="tel:+915652345678"
                  className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-charcoal-soft"
                >
                  <Phone className="h-4 w-4" />
                  +91 565 234 5678
                </a>
                <button
                  onClick={() => setLang(lang === "en" ? "hi" : "en")}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-charcoal-soft"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {lang === "en" ? "हिन्दी में देखें" : "View in English"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
