"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Floating WhatsApp button — fixed bottom-right, with subtle pulse ring.
 * Pings on hover to remind the user it's available.
 */
export function FloatingWhatsApp() {
  const [showLabel, setShowLabel] = useState(false);

  // After 6 seconds, briefly show a hover label as a hint
  useEffect(() => {
    const t = setTimeout(() => setShowLabel(true), 6000);
    const t2 = setTimeout(() => setShowLabel(false), 12000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.a
      href="https://wa.me/919876543210?text=I%20would%20like%20to%20enquire%20about%20availability%20at%20RK%20Residency"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with RK Residency on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-3"
    >
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative hidden items-center gap-2 rounded-2xl border border-charcoal/10 bg-white px-4 py-2.5 shadow-xl sm:flex"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLabel(false);
              }}
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-charcoal/10 bg-white text-charcoal/50 hover:text-charcoal"
              aria-label="Dismiss WhatsApp hint"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-sm font-semibold text-charcoal">
                Chat with us
              </span>
              <span className="font-display text-[11px] text-charcoal-soft">
                Replies in ~5 min, 7 AM–11 PM IST
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp circle */}
      <motion.span
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
      >
        <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/50 [animation-duration:2.6s]" />
        <MessageCircle className="relative h-6 w-6" />
      </motion.span>
    </motion.a>
  );
}

/**
 * Exit-intent offer modal — appears once per session on desktop only when the
 * user moves the cursor to the top of the viewport (intent to leave).
 */
export function ExitIntentModal({ onBookClick }: { onBookClick: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Desktop only — exit intent doesn't work well on touch
    if (window.matchMedia("(max-width: 768px)").matches) return;
    // Once per session
    if (sessionStorage.getItem("rk_exit_shown")) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 4 && !sessionStorage.getItem("rk_exit_shown")) {
        sessionStorage.setItem("rk_exit_shown", "1");
        setOpen(true);
      }
    };
    // Slight delay so it doesn't fire immediately on landing
    const enableTimer = setTimeout(() => {
      document.addEventListener("mouseout", handler);
    }, 8000);

    return () => {
      clearTimeout(enableTimer);
      document.removeEventListener("mouseout", handler);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-charcoal/80 backdrop-blur-md p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Special offer"
        >
          <motion.div
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 24, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 bg-white/80 text-charcoal backdrop-blur-sm transition-colors hover:bg-white focus-ring"
              aria-label="Close offer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image header */}
            <div className="relative h-44 overflow-hidden">
              <img
                src="/images/marigold-garland.jpg"
                alt="Marigold garland"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-marsala via-marsala/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                <div className="font-display text-xs uppercase tracking-[0.28em] text-gold-soft">
                  A small gift before you go
                </div>
                <h3 className="mt-1 font-serif text-2xl font-semibold">
                  15% off your first Braj stay
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <p className="font-display text-sm leading-relaxed text-charcoal-soft">
                Subscribe to our fortnightly Braj letter and receive a{" "}
                <span className="font-semibold text-marsala">15% off</span> code
                for your first booking — valid for 6 months, no minimum stay.
              </p>

              <div className="mt-4 space-y-2 text-left">
                {[
                  "Festival calendars (Janmashtami, Holi, Radhashtami)",
                  "Member-only flash offers",
                  "Curated Braj stories & temple guides",
                ].map((p) => (
                  <div key={p} className="flex items-start gap-2 font-display text-xs text-charcoal-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {p}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  close();
                  onBookClick();
                }}
                className="cta-glow mt-5 w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3 font-serif text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold"
              >
                Claim code &amp; check availability
              </button>
              <button
                onClick={close}
                className="mt-2 w-full font-display text-xs text-charcoal-soft transition-colors hover:text-charcoal"
              >
                No thanks, I'll browse a little longer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
