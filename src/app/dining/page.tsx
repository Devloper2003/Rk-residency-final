import { DiningPage } from "@/components/rk/pages/DiningPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/dining") },
  title: "Satvik Dining — RK Residency Vrindavan",
  description:
    "Pure vegetarian satvik dining at RK Residency. No onion, no garlic, no eggs. Full menu — Braj Thali, satvik puri-sabzi, rabri-jalebi, tulsi tea. Rooftop Yamuna Pavilion.",
};

export default function DiningRoute() {
  return <DiningPage />;
}
