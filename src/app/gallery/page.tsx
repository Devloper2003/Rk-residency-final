import { GalleryPage } from "@/components/rk/pages/GalleryPage";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "Gallery — RK Residency Vrindavan";
const pageDescription = "Step inside RK Residency — heritage interiors, Yamuna ghats, temple rituals and the changing colours of Vrindavan through the year.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/gallery") },
  openGraph: pageOpenGraph({ path: "/gallery", title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
};

export default function GalleryRoute() {
  return <GalleryPage />;
}
