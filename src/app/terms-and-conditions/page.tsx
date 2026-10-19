import { TermsPage } from "@/components/rk/pages/TermsPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Terms & Conditions — RK Residency Vrindavan";
const pageDescription = "Booking terms, check-in and check-out, payment terms, hotel rules, damage liability and force majeure for RK Residency, Vrindavan.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/terms-and-conditions") },
  openGraph: pageOpenGraph({ path: "/terms-and-conditions", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  robots: { index: true, follow: true },
};

export default function TermsRoute() {
  return <TermsPage />;
}
