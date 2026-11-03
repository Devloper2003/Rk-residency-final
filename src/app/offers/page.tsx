import { OffersListPage } from "@/components/rk/pages/OffersPages";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageTitle = "Offers & Packages — RK Residency Vrindavan";
const pageDescription = "Janmashtami Devotional Package, Holi Braj Experience, Stay 3 Pay 2 Pilgrim Saver. Sacred seasons, thoughtfully packaged at RK Residency.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/offers") },
  openGraph: pageOpenGraph({ path: "/offers", title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/hero-vrindavan.webp" }),
};

export default async function OffersRoute() {
  // SSR the SAME room rows the homepage and /rooms render — the owner's rule
  // is ONE price list across homepage, Rooms page and Offers page, so the
  // rates block on /offers reads the live DB prices at request time.
  const rooms = await db.room.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return <OffersListPage initialRooms={rooms} />;
}
