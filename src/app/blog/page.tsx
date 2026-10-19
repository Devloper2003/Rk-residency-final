import { BlogListPage } from "@/components/rk/pages/BlogPages";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

const pageTitle = "The Braj Journal — RK Residency Vrindavan";
const pageDescription = "Temple guides, festival calendars, local tips and stories from Vrindavan — written by our resident scholars and concierge team.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/blog") },
  openGraph: pageOpenGraph({ path: "/blog", title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
};

export default function BlogRoute() {
  return <BlogListPage />;
}
