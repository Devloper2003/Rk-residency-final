import { CancellationPage } from "@/components/rk/pages/CancellationPage";

export const metadata = {
  title: "Cancellation & Refund Policy — RK Residency Vrindavan",
  description:
    "Cancellation & Refund Policy for RK Residency — cancellation timeline, refund eligibility, no-show policy, early check-out, date modification, refund processing time.",
  robots: { index: true, follow: true },
};

export default function CancellationRoute() {
  return <CancellationPage />;
}
