import { AboutPage } from "@/components/rk/pages/AboutPage";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

// Live DB inventory on every request (same as the homepage).
export const dynamic = "force-dynamic";

// ≤60 chars per the SEO spec (the longer wording, 63 chars, truncated in Google)
const pageTitle = "About RK Residency | Heritage Hotel in Vrindavan";
const pageDescription = "RK Residency honours the legacy of Late Shri Ravi Karan Singh, a Kargil War hero — a heartfelt heritage stay for every devotee in Vrindavan.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/about") },
  openGraph: pageOpenGraph({ path: "/about", title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
};

export default async function AboutRoute() {
  // Audit H2: the rooms stat is the REAL inventory from the database, never a
  // hardcoded number.
  const rooms = await db.room.findMany({ select: { totalCount: true } });
  const roomsTotal = rooms.reduce((s, r) => s + r.totalCount, 0);
  return <AboutPage roomsTotal={roomsTotal} />;
}
