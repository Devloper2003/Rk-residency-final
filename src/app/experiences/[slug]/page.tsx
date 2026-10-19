import { ExperienceDetailPage } from "@/components/rk/pages/ExperiencesPages";
import { absUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} — RK Residency Vrindavan`,
    description: "Vrindavan experience guide from RK Residency.",
    // Self-referencing canonical for every experience detail page.
    alternates: { canonical: absUrl(`/experiences/${slug}`) },
  };
}

export default async function ExperienceDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExperienceDetailPage slug={slug} />;
}
