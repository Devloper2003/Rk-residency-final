import { ContactPage } from "@/components/rk/pages/ContactPage";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/contact") },
  title: "Contact & Location — RK Residency Vrindavan",
  description:
    "RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121. Phone +91 565 234 5678. Concierge replies within 4 hours.",
};

export default function ContactRoute() {
  return <ContactPage />;
}
