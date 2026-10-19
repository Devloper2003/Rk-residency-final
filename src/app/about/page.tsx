import { AboutPage } from "@/components/rk/pages/AboutPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/about") },
  title: "Our Story — RK Residency Vrindavan",
  description:
    "RK Residency was founded in 2024 as a heartfelt tribute to the legacy of Late Shri Ravi Karan Singh—a Kargil War hero whose courage and selfless sacrifice continue to inspire our journey of serving every devotee who visits the sacred land of Vrindavan.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
