import { FestivalCalendar } from "@/components/rk/FestivalCalendar";
import type { Metadata } from "next";
import { PageShell } from "@/components/rk/PageShell";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Braj Festival Calendar 2026 — RK Residency Vrindavan";
const pageDescription = "Makar Sankranti, Holi, Radhashtami, Janmashtami and Sharad Purnima — plan your Vrindavan pilgrimage around the Braj festival calendar.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/festivals") },
  openGraph: pageOpenGraph({ path: "/festivals", title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
};

export default function FestivalsRoute() {
  return (
    <>
      <FestivalCalendar />
    </>
  );
}
