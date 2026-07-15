import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { VisitorTracker } from "@/components/rk/VisitorTracker";
import { GoogleAnalytics } from "@/components/rk/GoogleAnalytics";

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
  title: "RK Residency — Heritage Luxury Stay in Vrindavan | Hotel near Banke Bihari Temple",
  description:
    "RK Residency is a heritage-luxury residency in Vrindavan on the banks of the Yamuna. Spiritual luxury for pilgrims, devotee families and cultural travellers. Steps from Banke Bihari Mandir, ISKCON, Prem Mandir. Direct booking best-price guarantee.",
  keywords: [
    "Vrindavan hotel",
    "hotel near Banke Bihari Temple",
    "hotel near ISKCON Vrindavan",
    "Vrindavan luxury stay",
    "Vrindavan resort booking",
    "RK Residency",
    "Braj region hotel",
    "spiritual luxury Vrindavan",
    "Yamuna aarti stay",
    "Prem Mandir hotel",
  ],
  authors: [{ name: "RK Residency" }],
  alternates: {
    canonical: "https://rkresidency.in/",
    languages: {
      "en-IN": "/",
      "hi-IN": "/hi",
    },
  },
  openGraph: {
    title: "RK Residency — Heritage Luxury Stay in Vrindavan",
    description:
      "Spiritual luxury on the banks of the Yamuna. Steps from Banke Bihari Mandir and ISKCON Vrindavan. Direct booking with best-price guarantee.",
    url: "https://rkresidency.in",
    siteName: "RK Residency",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/hero-vrindavan.jpg",
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
    images: ["/images/hero-vrindavan.jpg"],
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
        {children}
        <VisitorTracker />
        <GoogleAnalytics />
        <Toaster />
        <SonnerToaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
