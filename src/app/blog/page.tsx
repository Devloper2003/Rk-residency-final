import { BlogListPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { publicPostWhere } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

const pageTitle = "The Braj Journal — RK Residency Vrindavan";
const pageDescription = "Temple guides, festival calendars, local tips and stories from Vrindavan by our resident team. Plan your Braj pilgrimage with us.";

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
  // Scheduled posts (future publishOn) never appear here — publicPostWhere
  // filters on published + publishedAt <= now.
  const posts = await db.blogPost.findMany({
    where: publicPostWhere(),
    orderBy: [{ publishedAt: "desc" }],
  });
  return <BlogListPage initialPosts={posts} />;
}
