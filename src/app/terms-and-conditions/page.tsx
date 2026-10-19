import { TermsPage } from "@/components/rk/pages/TermsPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/terms-and-conditions") },
  title: "Terms & Conditions — RK Residency Vrindavan",
  description:
    "Terms & Conditions for RK Residency — booking terms, check-in/out, guest responsibilities, payment terms, hotel rules, damage liability, force majeure, governing law.",
  robots: { index: true, follow: true },
};

export default function TermsRoute() {
  return <TermsPage />;
}
