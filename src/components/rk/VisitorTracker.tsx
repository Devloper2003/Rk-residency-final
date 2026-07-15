"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Invisible component that tracks page views for analytics.
 * Fires a POST to /api/track on every route change.
 * Generates an anonymous session ID stored in sessionStorage.
 */
export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or retrieve anonymous session ID
    let sessionId = sessionStorage.getItem("rk_session_id");
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("rk_session_id", sessionId);
    }

    // Fire and forget — don't block page
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId,
      }),
    }).catch(() => {}); // Silently fail
  }, [pathname]);

  return null;
}
