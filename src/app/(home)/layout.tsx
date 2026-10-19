import type { Metadata } from "next";
import { absUrl } from "@/lib/seo";

/**
 * Per-route layout for the home page ("/").
 * The home page itself is a client component and cannot export metadata,
 * so its page-level SEO lives here. Canonical is self-referencing and
 * built from SITE_URL — never hardcoded.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: absUrl("/"),
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
