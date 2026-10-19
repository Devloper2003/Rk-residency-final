import { OffersListPage } from "@/components/rk/pages/OffersPages";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/offers") },
  title: "Offers & Packages — RK Residency Vrindavan",
  description:
    "Janmashtami Devotional Package, Holi Braj Experience, Stay 3 Pay 2 Pilgrim Saver. Sacred seasons, thoughtfully packaged at RK Residency.",
};

export default function OffersRoute() {
  return <OffersListPage />;
}
