import { ExperiencesListPage } from "@/components/rk/pages/ExperiencesPages";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/experiences") },
  title: "Vrindavan Experiences — RK Residency",
  description:
    "Five sacred sites within a 25-minute walk of RK Residency: Banke Bihari, ISKCON, Prem Mandir, Nidhivan, Yamuna Aarti. Full timings, history and pilgrim tips.",
};

export default function ExperiencesRoute() {
  return <ExperiencesListPage />;
}
