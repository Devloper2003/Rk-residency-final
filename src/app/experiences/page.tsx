import { ExperiencesListPage } from "@/components/rk/pages/ExperiencesPages";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Vrindavan Experiences — RK Residency";
const pageDescription = "Banke Bihari, ISKCON, Prem Mandir, Nidhivan and Yamuna Aarti — timings, history and pilgrim tips for five sacred sites near RK Residency.";

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
