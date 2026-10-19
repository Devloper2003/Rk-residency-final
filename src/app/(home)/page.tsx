import { HomeClient } from "@/components/rk/HomeClient";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { FAQS } from "@/lib/faq-data";
import { faqJsonLd, hotelJsonLd } from "@/lib/schema-org";

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
      <HomeClient initialRooms={rooms} />
    </>
  );
}
