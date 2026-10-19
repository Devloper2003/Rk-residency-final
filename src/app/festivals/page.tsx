import { FestivalCalendar } from "@/components/rk/FestivalCalendar";
import { PageShell } from "@/components/rk/PageShell";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/festivals") },
  title: "Braj Festival Calendar 2026 — RK Residency Vrindavan",
  description:
    "Six sacred festivals of Braj: Makar Sankranti, Vasant Panchami, Holi, Radhashtami, Janmashtami, Sharad Purnima. Plan your pilgrimage around the Vrindavan spiritual calendar.",
};

export default function FestivalsRoute() {
  return (
    <>
      <FestivalCalendar />
    </>
  );
}
