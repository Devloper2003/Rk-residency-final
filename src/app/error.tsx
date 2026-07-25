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
    console.error("APP CRASH:", error.message, error.stack);
  }, [error]);

  return (
    <div style={{ padding: "40px", fontFamily: "monospace", fontSize: "14px" }}>
      <h2 style={{ color: "red", marginBottom: "16px" }}>App Error (dev boundary)</h2>
      <p style={{ marginBottom: "8px" }}><strong>Message:</strong> {error.message}</p>
      <p style={{ marginBottom: "8px" }}><strong>Digest:</strong> {error.digest || "none"}</p>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#666" }}>
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
