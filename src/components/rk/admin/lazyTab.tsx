"use client";

import React, { lazy, useRef } from "react";
import { AlertTriangle, RefreshCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Admin tab chunk-loading resilience.
 *
 * WHY THIS EXISTS: every admin tab is a lazily-imported chunk. If that one
 * network request fails (flaky connection, dropped request, or a deploy
 * replacing the chunks while an old page is open), React's `lazy()` caches
 * the rejected promise forever — the tab can never recover, "Try again" on
 * the page-level error boundary keeps failing, and the whole console shows
 * the full-screen "Something went wrong" page (owner-reported bug).
 *
 * THE FIX, in three layers:
 *  1. lazyRetry — retries the dynamic import automatically (transient
 *     network hiccups self-heal invisibly).
 *  2. useLazyTab — gives every retry attempt a FRESH lazy component, so the
 *     "Try again" button in the error card re-runs the import instead of
 *     reusing the cached rejected promise.
 *  3. TabErrorBoundary — a per-tab error boundary so a broken tab shows a
 *     small in-place error card; the sidebar, header and every other tab
 *     stay alive. Only a truly unrecoverable chunk still leaves the panel.
 */

export type TabFactory = () => Promise<{ default: React.ComponentType<any> }>;

/**
 * React.lazy that re-attempts the import up to `retries` times (linear
 * backoff) before giving up. Covers momentary network drops and 502s.
 */
export function lazyRetry(
  factory: TabFactory,
  retries = 2,
  baseDelayMs = 500,
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(async () => {
    let lastError: unknown = new Error("Failed to load section");
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
      }
      try {
        return await factory();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  });
}

/**
 * Returns the lazy component for a tab, creating a NEW one per attempt so a
 * retry actually re-runs the import (React.lazy caches the constructor
 * result, so retrying requires a fresh instance).
 */
export function useLazyTab(
  tab: string,
  attempt: number,
  factories: Record<string, TabFactory>,
): React.LazyExoticComponent<React.ComponentType<any>> {
  const cache = useRef(new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>());
  const key = `${tab}:${attempt}`;
  let component = cache.current.get(key);
  if (!component && factories[tab]) {
    component = lazyRetry(factories[tab]);
    cache.current.set(key, component);
  }
  return component as React.LazyExoticComponent<React.ComponentType<any>>;
}

/** In-place error card for a failed tab — the rest of the console stays usable. */
function TabErrorCard({ onRetry, willAutoReload }: { onRetry: () => void; willAutoReload: boolean }) {
  return (
    <div className="rounded-2xl border border-marsala/30 bg-marsala/5 p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-marsala/10 text-marsala">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="font-serif text-lg font-semibold text-marsala">This section failed to load</p>
      <p className="mx-auto mt-1 max-w-md font-display text-sm text-charcoal-soft">
        Usually a temporary network hiccup, or the site was just redeployed and this
        open page still references the old files. Everything else in the console is
        unaffected.
      </p>
      {willAutoReload && (
        <p className="mx-auto mt-2 max-w-md font-display text-xs text-charcoal-soft/70">
          The console will refresh itself in a moment to pick up the latest version…
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={onRetry}
          className="rounded-full bg-teal px-5 py-2 text-xs text-ivory hover:bg-teal-deep"
        >
          <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Try again
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-full border-charcoal/15 px-5 py-2 text-xs text-charcoal-soft hover:border-teal/40 hover:text-teal"
        >
          <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Reload console
        </Button>
      </div>
    </div>
  );
}

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  /** Changing this remounts the boundary clear — pass `${tab}:${attempt}`. */
  resetKey: string;
  /** Invoked by the card's "Try again" — should bump the attempt counter. */
  onRetry: () => void;
}

/** Detects chunk/dynamic-import load failures (as opposed to render errors). */
function isChunkLoadError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  if (!e) return false;
  if (e.name === "ChunkLoadError") return true;
  return /failed to load chunk|failed to fetch dynamically imported|loading chunk|error loading chunk/i
    .test(e.message || "");
}

const CHUNK_RELOAD_FLAG = "rk_admin_chunk_reload_at";

/**
 * Per-tab error boundary. Catches chunk-load failures and render errors for a
 * single tab and shows the in-place error card instead of unmounting the
 * whole admin panel.
 *
 * Chunk failures additionally self-heal: the console reloads itself ONCE
 * (guarded by a sessionStorage flag so a genuinely unreachable server can
 * never cause a reload loop). A full reload is the only reliable recovery —
 * browsers permanently remember a failed dynamic import for the lifetime of
 * the document, so re-importing the same chunk can never succeed.
 */
export class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };
  private reloadTimer: number | null = null;
  private autoReloadArmed = false;

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[AdminPanel] tab crashed:", error.message);
    if (isChunkLoadError(error)) this.scheduleChunkRecovery();
  }

  componentDidUpdate(prev: TabErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentWillUnmount() {
    if (this.reloadTimer !== null) window.clearTimeout(this.reloadTimer);
  }

  /** One silent page reload to pick up a fresh deploy / heal a dropped chunk. */
  private scheduleChunkRecovery() {
    try {
      const last = Number(sessionStorage.getItem(CHUNK_RELOAD_FLAG) || 0);
      const now = Date.now();
      if (now - last < 30_000) return; // already auto-reloaded recently — show the card instead
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(now));
    } catch {
      return; // storage unavailable — never auto-reload blindly
    }
    if (this.reloadTimer !== null) return;
    this.autoReloadArmed = true;
    this.reloadTimer = window.setTimeout(() => window.location.reload(), 700);
  }

  render() {
    if (this.state.error) {
      return <TabErrorCard onRetry={this.props.onRetry} willAutoReload={this.autoReloadArmed} />;
    }
    return this.props.children;
  }
}
