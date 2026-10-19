import { OfferDetailPage } from "@/components/rk/pages/OffersPages";
import { absUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} — RK Residency Vrindavan`,
    description: "Festival package details at RK Residency, Vrindavan.",
    // Self-referencing canonical for every offer detail page.
    alternates: { canonical: absUrl(`/offers/${slug}`) },
  };
}

export default async function OfferDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OfferDetailPage slug={slug} />;
}
