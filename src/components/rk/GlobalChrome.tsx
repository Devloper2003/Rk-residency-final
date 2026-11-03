"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/rk/Footer";
import { ContactActionBar, FloatingWhatsApp } from "@/components/rk/FloatingActions";

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
      {/* Mobile-only sticky Call/WhatsApp bar (owner ask — guests enquire by
          call/WhatsApp). The spacer reserves the bar's height so the fixed
          bar never covers the footer's last line; from `sm` up the round
          WhatsApp FAB (below) takes over instead. */}
      <ContactActionBar />
      <div aria-hidden="true" className="h-[60px] w-full sm:hidden" />
      <FloatingWhatsApp />
    </>
  );
}
