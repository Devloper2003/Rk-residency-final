import { BlogListPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/schema-org";
import { publicPostWhere } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

// Title: 55 chars (limit 60), description: 91 chars (limit 155)
const pageTitle = "The Braj Journal | Vrindavan Temple Guides & Travel Tips";
const pageDescription = "Temple guides, festival calendars and local tips from our resident scholars and concierge team.";

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

  return (
    <>
      {/* JSON-LD: CollectionPage + BreadcrumbList for the blog listing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageJsonLd()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ])
          ),
        }}
      />
      <BlogListPage initialPosts={posts} />
    </>
  );
}
