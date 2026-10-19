import { AboutPage } from "@/components/rk/pages/AboutPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "About RK Residency | Heritage Hotel in Kailash Nagar, Vrindavan";
const pageDescription = "RK Residency honours the legacy of Late Shri Ravi Karan Singh, a Kargil War hero — a heartfelt heritage stay for every devotee in Vrindavan.";

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
