"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error.message, error.stack);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md space-y-4"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-marsala/10 text-marsala">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-charcoal">Something went wrong</h2>
        <p className="font-display text-sm text-charcoal-soft">We encountered an unexpected error. Please try again.</p>
        <button
          onClick={reset}
          className="rounded-full bg-teal px-6 py-2.5 font-display text-sm font-semibold text-ivory transition-colors hover:bg-teal-deep"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}
