import { CancellationPage } from "@/components/rk/pages/CancellationPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Cancellation & Refund Policy — RK Residency Vrindavan";
const pageDescription = "Cancellation timelines, refund eligibility, no-show policy and date-change rules for reservations at RK Residency, Vrindavan.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/cancellation-policy") },
  openGraph: pageOpenGraph({ path: "/cancellation-policy", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  robots: { index: true, follow: true },
};

export default function CancellationRoute() {
  return <CancellationPage />;
}
