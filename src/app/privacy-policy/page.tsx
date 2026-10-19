import { PrivacyPolicyPage } from "@/components/rk/pages/PrivacyPolicyPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Privacy Policy — RK Residency Vrindavan";
const pageDescription = "How RK Residency collects, uses, stores and protects your personal information when you book a stay or visit our website.";

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
