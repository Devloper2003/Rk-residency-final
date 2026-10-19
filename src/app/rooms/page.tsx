import { RoomsListPage } from "@/components/rk/pages/RoomsListPage";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageTitle = "Rooms & Suites — RK Residency Vrindavan";
const pageDescription =
  "Explore all rooms, suites and the Gokul Royal Villa at RK Residency. Hand-carved teak, Makrana marble, Braj textiles. Direct booking best-price guarantee.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/rooms") },
  openGraph: pageOpenGraph({ path: "/rooms", title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/heritage-room.webp" }),
};

export default async function RoomsRoute() {
  // SSR: room data is fetched on the server so names, prices and descriptions
  // are present in the initial HTML (crawlable without JS).
  const rooms = await db.room.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return <RoomsListPage initialRooms={rooms} />;
}
