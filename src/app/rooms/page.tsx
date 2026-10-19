import { RoomsListPage } from "@/components/rk/pages/RoomsListPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/rooms") },
  title: "Rooms & Suites — RK Residency Vrindavan",
  description:
    "Explore all rooms, suites and the Gokul Royal Villa at RK Residency. Hand-carved teak, Makrana marble, Braj textiles. Direct booking best-price guarantee.",
};

export default function RoomsRoute() {
  return <RoomsListPage />;
}
