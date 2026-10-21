import { HomeClient } from "@/components/rk/HomeClient";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { FAQS } from "@/lib/faq-data";
import { faqJsonLd, hotelJsonLd } from "@/lib/schema-org";
import { publicPostWhere } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

const pageTitle = "Hotel near Banke Bihari Mandir, Vrindavan | RK Residency";
const pageDescription =
  "Heritage hotel near Banke Bihari Mandir & ISKCON Vrindavan. Satvik dining, serene rooms on the Yamuna. Book direct for the best price.";

export const metadata: Metadata = {
  alternates: {
    canonical: absUrl("/"),
  },
  openGraph: pageOpenGraph({ path: "/", title: pageTitle, description: pageDescription }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription }),
};

export default async function HomeRoute() {
  // SSR: the first three rooms (hero-adjacent section) are fetched on the
  // server so room names, taglines and prices are in the initial HTML.
  const rooms = await db.room.findMany({ orderBy: [{ sortOrder: "asc" }] });
  // Homepage latest-posts section (Task 8): the 3 newest live stories,
  // revalidated whenever a post is published (blog-publish.ts).
  const latestPosts = await db.blogPost.findMany({
    where: publicPostWhere(),
    orderBy: [{ publishedAt: "desc" }],
    take: 3,
    select: { id: true, slug: true, title: true, excerpt: true, imageUrl: true, category: true, readingMins: true },
  });
  // SSR: approved guest reviews are fetched on the server and passed down to
  // <Testimonials>, so every review card is in the initial HTML instead of
  // appearing only after a client-side /api/reviews fetch. Same query as the
  // API route (approved only, newest first) so both paths stay identical.
  const reviews = await db.review.findMany({
    where: { approved: true },
    orderBy: [{ createdAt: "desc" }],
  });
  return (
    <>
      {/* Structured data — server-rendered into the initial HTML. Built from
          site.config + live room prices; never contains invented business data. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd({ rooms })) }}
      />
      {/* FAQPage built from the SAME data the FAQ section renders. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
      <HomeClient initialRooms={rooms} initialLatestPosts={latestPosts} initialReviews={reviews} />
    </>
  );
}
