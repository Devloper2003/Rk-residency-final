"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/rk/Footer";
import { FloatingWhatsApp } from "@/components/rk/FloatingActions";

/**
 * Site-wide chrome rendered once from the root layout so EVERY page gets the
 * same footer (NAP + Google Business profile link) and the sticky WhatsApp
 * enquiry CTA — the owner's #1 ask, since Vrindavan guests overwhelmingly
 * enquire on WhatsApp.
 *
 * Hidden on:
 *  - /admin        (back-office must stay clean of guest CTAs)
 *  - /booking-doc  (print-quality invoice/voucher document)
 */
const HIDE_PREFIXES = ["/admin", "/booking-doc"];

export function GlobalChrome() {
  const pathname = usePathname() || "/";
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
