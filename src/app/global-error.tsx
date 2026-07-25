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
    console.error("GLOBAL CRASH:", error.message, error.stack);
  }, [error]);

  return (
    <html>
      <body style={{ padding: "40px", fontFamily: "monospace", fontSize: "14px" }}>
        <h2 style={{ color: "red" }}>Global Error</h2>
        <p><strong>Message:</strong> {error.message}</p>
        <p><strong>Stack:</strong></p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
        <button onClick={reset} style={{ marginTop: "16px", padding: "8px 16px" }}>Try again</button>
      </body>
    </html>
  );
}
