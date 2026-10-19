import { GalleryPage } from "@/components/rk/pages/GalleryPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/gallery") },
  title: "Gallery — RK Residency Vrindavan",
  description:
    "Step inside RK Residency — heritage interiors, Yamuna ghats, temple rituals and the changing colours of Vrindavan through the year.",
};

export default function GalleryRoute() {
  return <GalleryPage />;
}
