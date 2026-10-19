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
import { ThemeProvider } from "@/components/rk/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
         <NextRouterBridge />
        {children}
        
        <GlobalBookingWidget />
        <VisitorTracker />
        <GoogleAnalytics />
        <SonnerToaster position="bottom-right" richColors closeButton />
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

