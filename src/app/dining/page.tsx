import { DiningPage } from "@/components/rk/pages/DiningPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Satvik Dining — RK Residency Vrindavan";
const pageDescription = "Pure vegetarian satvik dining at RK Residency. No onion, no garlic, no eggs. Full menu — Braj Thali, satvik puri-sabzi, rabri-jalebi, tulsi tea. Rooftop Yamuna Pavilion.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/dining") },
  openGraph: pageOpenGraph({ path: "/dining", title: pageTitle, description: pageDescription, image: "/images/satvik-dining.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/satvik-dining.webp" }),
};

export default function DiningRoute() {
  return <DiningPage />;
}
