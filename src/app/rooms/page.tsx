import { RoomsListPage } from "@/components/rk/pages/RoomsListPage";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageTitle = "Rooms & Suites in Vrindavan near Banke Bihari Mandir | RK Residency";
const pageDescription =
  "Explore the Deluxe Room, Suite and Triple Bedroom at RK Residency Vrindavan — book direct near Banke Bihari Mandir.";

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
