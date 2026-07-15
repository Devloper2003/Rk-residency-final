import { ExperienceDetailPage } from "@/components/rk/pages/ExperiencesPages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} — RK Residency Vrindavan`,
    description: "Vrindavan experience guide from RK Residency.",
  };
}

export default async function ExperienceDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExperienceDetailPage slug={slug} />;
}
