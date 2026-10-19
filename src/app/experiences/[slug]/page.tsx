import { ExperienceDetailPage } from "@/components/rk/pages/ExperiencesPages";
import { EXPERIENCES } from "@/lib/experiences-data";
import { absUrl, pageOpenGraph, pageTwitter, titledPageTitle, seoDescription } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Real experience data for unique OG tags per experience.
  const exp = EXPERIENCES.find((e) => e.slug === slug);

  const title = titledPageTitle(exp?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
  const description = seoDescription(
    exp?.description || "Vrindavan experience guide from RK Residency."
  );
  const image = exp?.image?.split("?")[0]; // strip dead resize params for OG

  return {
    title,
    description,
    // Self-referencing canonical for every experience detail page.
    alternates: { canonical: absUrl(`/experiences/${slug}`) },
    openGraph: pageOpenGraph({ path: `/experiences/${slug}`, title, description, image }),
    twitter: pageTwitter({ title, description, image }),
  };
}

export default async function ExperienceDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ExperienceDetailPage slug={slug} />;
}
