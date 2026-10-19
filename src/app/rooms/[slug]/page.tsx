import { RoomDetailPage } from "@/components/rk/pages/RoomDetailPage";
import { db } from "@/lib/db";
import { absUrl, pageOpenGraph, pageTwitter, titledPageTitle, seoDescription } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Real room data for unique OG tags per room.
  const room = await db.room.findUnique({ where: { slug } });

  const title = titledPageTitle(room?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
  const description = seoDescription(
    room?.description || "Room details, amenities, gallery and direct booking at RK Residency, Vrindavan."
  );
  let image: string | undefined;
  if (room?.imageUrls) {
    try {
      const imgs: string[] = JSON.parse(room.imageUrls);
      image = imgs[0];
    } catch {
      /* ignore malformed image JSON */
    }
  }

  return {
    title,
    description,
    // Self-referencing canonical for every room detail page.
    alternates: { canonical: absUrl(`/rooms/${slug}`) },
    openGraph: pageOpenGraph({ path: `/rooms/${slug}`, title, description, image }),
    twitter: pageTwitter({ title, description, image }),
  };
}

export default async function RoomDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoomDetailPage slug={slug} />;
}
