// AFTER:
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.message, error.stack);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: "40px", fontFamily: "Georgia, serif", background: "#FBF6EC", textAlign: "center" }}>
        <h2 style={{ color: "#231F1C", fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h2>
        <p style={{ color: "#6B6560", fontSize: "14px", marginBottom: "24px" }}>An unexpected error occurred. Please try again.</p>
        <button onClick={reset} style={{ background: "#0E4C4F", color: "#FBF6EC", border: "none", padding: "10px 24px", borderRadius: "999px", cursor: "pointer", fontSize: "14px" }}>Try again</button>
      </body>
    </html>
  );
}
