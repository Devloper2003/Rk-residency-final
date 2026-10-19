import { ContactPage } from "@/components/rk/pages/ContactPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Contact & Location — RK Residency Vrindavan";
const pageDescription = "RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121. Concierge replies within 4 hours.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/contact") },
  openGraph: pageOpenGraph({ path: "/contact", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
};

export default function ContactRoute() {
  return <ContactPage />;
}
