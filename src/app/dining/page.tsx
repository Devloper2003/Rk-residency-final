import { DiningPage } from "@/components/rk/pages/DiningPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Satvik Dining — RK Residency Vrindavan";
const pageDescription = "Pure satvik dining — no onion, no garlic. Braj Thali, rabri-jalebi and tulsi tea at the rooftop Yamuna Pavilion, RK Residency Vrindavan.";

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
