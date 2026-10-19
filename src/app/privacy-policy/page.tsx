import { PrivacyPolicyPage } from "@/components/rk/pages/PrivacyPolicyPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Privacy Policy — RK Residency Vrindavan";
const pageDescription = "Privacy Policy for RK Residency — how we collect, use, store, and protect your personal information when you visit our website, make a reservation, or stay at our hotel.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/privacy-policy") },
  openGraph: pageOpenGraph({ path: "/privacy-policy", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
