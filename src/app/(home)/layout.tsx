import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter } from "@/lib/seo";

/**
 * Per-route layout for the home page ("/").
 * The home page itself is a client component and cannot export metadata,
 * so its page-level SEO lives here. Canonical is self-referencing and
 * built from SITE_URL — never hardcoded.
 */
const pageTitle = "RK Residency — Heritage Luxury Stay in Vrindavan";
const pageDescription =
  "Heritage-luxury stay on the banks of the Yamuna, steps from Banke Bihari Mandir and ISKCON. Direct booking with best-price guarantee.";

export const metadata: Metadata = {
  alternates: {
    canonical: absUrl("/"),
  },
  openGraph: pageOpenGraph({ path: "/", title: pageTitle, description: pageDescription }),
  twitter: pageTwitter({ title: pageTitle, description: pageDescription }),
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
