"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSettingValue } from "@/lib/site-content";
import { sanitizeWhatsapp } from "@/lib/use-contact-info";
import { BUSINESS } from "@/lib/site.config";

/**
 * WhatsAppFab — sticky WhatsApp enquiry button.
 *
 * Vrindavan guests overwhelmingly enquire on WhatsApp before booking, so the
 * CTA must be one tap away on every page (especially mobile). Floats bottom-
 * right above the content, links straight into a wa.me chat with a
 * pre-filled greeting. Hidden until slight scroll on desktop to avoid
 * covering content; always visible on mobile.
 */
export function WhatsAppFab() {
  const raw = useSettingValue("whatsapp_number", BUSINESS.whatsappNumber);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const digits = sanitizeWhatsapp(raw);
  if (!digits) return null;

  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Radhe Radhe! Mujhe RK Residency Vrindavan mein booking ke baare mein jaanna hai."
  )}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with RK Residency on WhatsApp"
      initial={{ opacity: 0, scale: 0.6, y: 16 }}
      animate={
        visible
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: 0.6, y: 16 }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-4 pr-5 font-display text-sm font-bold text-white shadow-xl shadow-charcoal/25 transition-transform hover:scale-[1.04] active:scale-95 sm:bottom-6 sm:right-6 ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        {/* Soft ping ring — draws attention without being loud */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-60" />
        <MessageCircle className="relative h-5 w-5 fill-white/20" />
      </span>
      WhatsApp
    </motion.a>
  );
}
