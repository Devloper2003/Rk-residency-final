import { PrivacyPolicyPage } from "@/components/rk/pages/PrivacyPolicyPage";

export const metadata = {
  title: "Privacy Policy — RK Residency Vrindavan",
  description:
    "Privacy Policy for RK Residency — how we collect, use, store, and protect your personal information when you visit our website, make a reservation, or stay at our hotel.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
