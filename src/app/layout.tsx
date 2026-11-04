import { NextRouterBridge } from "@/components/rk/NextRouterBridge";
import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { VisitorTracker } from "@/components/rk/VisitorTracker";
import { GoogleTagManager } from "@/components/rk/GoogleTagManager";
import { GoogleAnalytics } from "@/components/rk/GoogleAnalytics";
import { SITE_URL } from "@/lib/site.config";
import { GlobalBookingWidget } from "@/components/rk/GlobalBookingWidget";
import { GlobalChrome } from "@/components/rk/GlobalChrome";
import { ThemeProvider } from "@/components/rk/ThemeProvider";
import { SiteContentProvider } from "@/lib/site-content";
import { db } from "@/lib/db";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Hotel near Banke Bihari Mandir, Vrindavan | RK Residency",
  description:
    "Heritage hotel near Banke Bihari Mandir & ISKCON Vrindavan. Satvik dining, serene rooms on the Yamuna. Book direct for the best price.",
  authors: [{ name: "RK Residency" }],
  // NOTE: no site-wide canonical here. Canonicals are set PER PAGE
  // (self-referencing, built from SITE_URL) in each route's metadata so no
  // page ever inherits another page's canonical.
  openGraph: {
    title: "Hotel near Banke Bihari Mandir, Vrindavan | RK Residency",
    description:
      "Heritage hotel near Banke Bihari Mandir & ISKCON Vrindavan. Satvik dining, serene rooms on the Yamuna. Book direct for the best price.",
    url: "/",
    siteName: "RK Residency",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/hero-vrindavan.webp",
        width: 1344,
        height: 768,
        alt: "RK Residency — golden-hour view of Vrindavan temple skyline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel near Banke Bihari Mandir, Vrindavan | RK Residency",
    description:
      "Heritage hotel near Banke Bihari Mandir & ISKCON Vrindavan. Book direct for the best price.",
    images: ["/images/hero-vrindavan.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    icons: {
    icon: "/uploads/rk-residency-vrindavan-logo.webp",
    apple: "/uploads/rk-residency-vrindavan-logo.webp",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side content hydration: read the live SiteContent map (every
  // admin-editable text + image on the site) once per request and provide
  // it to all client sections. First paint therefore shows the ADMIN-SET
  // values — hardcoded code fallbacks are no longer visible, ever. The
  // fetch is wrapped in try/catch: if the DB is unreachable the map is
  // simply empty and consumers use their code fallbacks (previous behaviour).
  let initialContent: Record<string, string> = {};
  try {
    const rows = await db.siteContent.findMany({ select: { key: true, value: true } });
    initialContent = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // Fall back to empty map — sections use their code fallbacks.
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${cormorant.variable} ${inter.variable} antialiased bg-ivory text-charcoal font-sans`}
             >
        {/* Google Tag Manager (noscript) — per GTM spec this must be the FIRST
            element inside <body>, right after the opening tag. */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KSSWNL9K"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* Google Tag Manager — loaded with beforeInteractive so Next.js injects
            it as high in the <head> as possible, exactly as GTM requires. */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KSSWNL9K');`}
        </Script>
        <ThemeProvider>
         <SiteContentProvider initial={initialContent}>
          <NextRouterBridge />
        {children}
        
        <GlobalBookingWidget />
        <VisitorTracker />
        <GoogleAnalytics />
        <SonnerToaster position="bottom-right" richColors closeButton />
        {/* Site-wide footer (NAP + Google profile link) + sticky WhatsApp CTA —
            one single source for every page; hidden on /admin & /booking-doc. */}
        <GlobalChrome />
          </SiteContentProvider>
          </ThemeProvider>
        {/* Razorpay Checkout.js — loaded lazily, only used when user pays */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

