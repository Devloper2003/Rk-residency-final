"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

/**
 * GoogleAnalytics — loads GA4 tracking script if a measurement ID is configured.
 * Fetches the GA ID from /api/site-settings at runtime so admins can configure
 * it from the admin panel without redeploying.
 * Falls back to G-F4SZRNY72V if no ID is configured in settings.
 */
const DEFAULT_GA_ID = "G-F4SZRNY72V";

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        const id = data.settings?.ga_measurement_id;
        if (id && id.startsWith("G-")) setGaId(id);
        else setGaId(DEFAULT_GA_ID); // fallback to default GA ID
      })
      .catch(() => {
        setGaId(DEFAULT_GA_ID); // fallback on fetch error too
      });
  }, []);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
