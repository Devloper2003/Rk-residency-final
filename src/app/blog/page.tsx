import { BlogListPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageTitle = "The Braj Journal — RK Residency Vrindavan";
const pageDescription = "Temple guides, festival calendars, local tips and stories from Vrindavan — written by our resident scholars and concierge team.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absUrl("/blog") },
  openGraph: pageOpenGraph({ path: "/blog", title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription, image: "/images/marigold-garland.webp" }),
};

export default async function BlogRoute() {
  // SSR: published posts are fetched on the server so titles, excerpts and
  // cover images are present in the initial HTML (crawlable without JS).
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }],
  });
  return <BlogListPage initialPosts={posts} />;
}
