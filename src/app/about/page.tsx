import { AboutPage } from "@/components/rk/pages/AboutPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Our Story — RK Residency Vrindavan";
const pageDescription = "RK Residency was founded in 2024 as a heartfelt tribute to the legacy of Late Shri Ravi Karan Singh—a Kargil War hero whose courage and selfless sacrifice continue to inspire our journey of serving every devotee who visits the sacred land of Vrindavan.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/about") },
  openGraph: pageOpenGraph({ path: "/about", title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
};

export default function AboutRoute() {
  return <AboutPage />;
}
