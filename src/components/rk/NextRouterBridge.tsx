"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Bridges Next.js client-side router into the Zustand router store
 * so navigate() uses soft push instead of full page reload.
 */
export function NextRouterBridge() {
  const router = useRouter();
  useEffect(() => {
    (window as any).__nextRouterPush = (path: string) => router.push(path);
    return () => { delete (window as any).__nextRouterPush; };
  }, [router]);
  return null;
}
