import { FestivalCalendar } from "@/components/rk/FestivalCalendar";
import type { Metadata } from "next";
import { PageShell } from "@/components/rk/PageShell";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Braj Festival Calendar 2026 — RK Residency Vrindavan";
const pageDescription = "Six sacred festivals of Braj: Makar Sankranti, Vasant Panchami, Holi, Radhashtami, Janmashtami, Sharad Purnima. Plan your pilgrimage around the Vrindavan spiritual calendar.";

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
