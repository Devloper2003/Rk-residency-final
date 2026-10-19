import { OfferDetailPage } from "@/components/rk/pages/OffersPages";
import { db } from "@/lib/db";
import { absUrl, pageOpenGraph, pageTwitter, titledPageTitle, seoDescription } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Real offer data for unique OG tags per offer.
  const offer = await db.offer.findUnique({ where: { slug } });

  const title = titledPageTitle(offer?.title || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
  const description = seoDescription(
    offer?.tagline || offer?.description || "Festival package details at RK Residency, Vrindavan."
  );
  const image = offer?.imageUrl || undefined;

  return {
    title,
    description,
    // Self-referencing canonical for every offer detail page.
    alternates: { canonical: absUrl(`/offers/${slug}`) },
    openGraph: pageOpenGraph({ path: `/offers/${slug}`, title, description, image }),
    twitter: pageTwitter({ title, description, image }),
  };
}

export default async function OfferDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OfferDetailPage slug={slug} />;
}
