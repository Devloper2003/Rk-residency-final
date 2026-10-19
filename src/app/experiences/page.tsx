import { ExperiencesListPage } from "@/components/rk/pages/ExperiencesPages";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Vrindavan Experiences — RK Residency";
const pageDescription = "Five sacred sites within a 25-minute walk of RK Residency: Banke Bihari, ISKCON, Prem Mandir, Nidhivan, Yamuna Aarti. Full timings, history and pilgrim tips.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/experiences") },
  openGraph: pageOpenGraph({ path: "/experiences", title: pageTitle, description: pageDescription, image: "/images/yamuna-aarti.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/yamuna-aarti.webp" }),
};

export default function ExperiencesRoute() {
  return <ExperiencesListPage />;
}
