import { RoomDetailPage } from "@/components/rk/pages/RoomDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} — RK Residency Vrindavan`,
    description: "Room details, amenities, gallery and direct booking at RK Residency, Vrindavan.",
  };
}

export default async function RoomDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoomDetailPage slug={slug} />;
}
