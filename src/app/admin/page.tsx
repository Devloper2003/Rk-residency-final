import { AdminPanel } from "@/components/rk/admin/AdminPanel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Admin Console — RK Residency",
  robots: { index: false, follow: false },
};

/**
 * Admin route — fully client-side. All data fetching happens inside each
 * tab component via the consolidated /api/admin/all endpoint. This keeps the
 * admin panel always live: new bookings show up immediately, CRUD operations
 * reflect instantly, and the dashboard reads fresh stats on every visit.
 */
export default function AdminRoute() {
  return <AdminPanel />;
}
