import { BlogListPage } from "@/components/rk/pages/BlogPages";
import { absUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absUrl("/blog") },
  title: "The Braj Journal — RK Residency Vrindavan",
  description:
    "Temple guides, festival calendars, local tips and stories from Vrindavan — written by our resident scholars and concierge team.",
};

export default function BlogRoute() {
  return <BlogListPage />;
}
