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
  title: "RK Residency — Heritage Luxury Stay in Vrindavan",
  description:
    "Heritage-luxury residency on the banks of the Yamuna, steps from Banke Bihari Mandir and ISKCON. Direct booking with best-price guarantee.",
  authors: [{ name: "RK Residency" }],
  // NOTE: no site-wide canonical here. Canonicals are set PER PAGE
  // (self-referencing, built from SITE_URL) in each route's metadata so no
  // page ever inherits another page's canonical.
  openGraph: {
    title: "RK Residency — Heritage Luxury Stay in Vrindavan",
    description:
      "Spiritual luxury on the banks of the Yamuna. Steps from Banke Bihari Mandir and ISKCON Vrindavan. Direct booking with best-price guarantee.",
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
    title: "RK Residency — Heritage Luxury Stay in Vrindavan",
    description:
      "Spiritual luxury on the banks of the Yamuna. Direct booking with best-price guarantee.",
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
    icon: "/uploads/4554e352db41d79f.webp",
    apple: "/uploads/4554e352db41d79f.webp",
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
        <ThemeProvider>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KSSWNL9K');`}
        </Script>
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

