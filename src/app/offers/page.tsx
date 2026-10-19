import { OffersListPage } from "@/components/rk/pages/OffersPages";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Offers & Packages — RK Residency Vrindavan";
const pageDescription = "Janmashtami Devotional Package, Holi Braj Experience, Stay 3 Pay 2 Pilgrim Saver. Sacred seasons, thoughtfully packaged at RK Residency.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/offers") },
  openGraph: pageOpenGraph({ path: "/offers", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
};

export default function OffersRoute() {
  return <OffersListPage />;
}
