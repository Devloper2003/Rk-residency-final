"use client";

import { useEffect, useState } from "react";

/**
 * In-memory cache shared across all hook consumers on the same page.
 * Avoids refetching /api/site-content when multiple components mount.
 */
type ContentMap = Record<string, string>;
type SettingsMap = Record<string, string>;

let contentCache: ContentMap | null = null;
let settingsCache: SettingsMap | null = null;
let contentPromise: Promise<ContentMap> | null = null;
let settingsPromise: Promise<SettingsMap> | null = null;

async function fetchContent(): Promise<ContentMap> {
  if (contentCache) return contentCache;
  if (!contentPromise) {
    contentPromise = fetch("/api/site-content")
      .then((r) => r.json())
      .then((d) => {
        contentCache = d.content || {};
        return contentCache;
      })
      .catch(() => (contentCache = {}));
  }
  return contentPromise;
}

async function fetchSettings(): Promise<SettingsMap> {
  if (settingsCache) return settingsCache;
  if (!settingsPromise) {
    settingsPromise = fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        settingsCache = d.settings || {};
        return settingsCache;
      })
      .catch(() => (settingsCache = {}));
  }
  return settingsPromise;
}

/**
 * React hook that returns the full site-content map.
 * - Returns `null` on first render (so SSR markup matches initial client render — no hydration mismatch).
 * - Returns `{}` while loading (after mount).
 * - Returns the populated map once fetched.
 *
 * Use `useContentValue("hero.headline", "Fallback text")` for individual values.
 */
export function useSiteContent(): ContentMap | null {
  const [content, setContent] = useState<ContentMap | null>(null);
  useEffect(() => {
    fetchContent().then(setContent);
  }, []);
  return content;
}

/** Same as useSiteContent but for /api/site-settings. */
export function useSiteSettings(): SettingsMap | null {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);
  return settings;
}

/**
 * Convenience hook: returns a single content value with a fallback.
 * Returns the fallback until the content map is loaded.
 */
export function useContentValue(key: string, fallback: string): string {
  const content = useSiteContent();
  if (content === null) return fallback;
  return content[key] ?? fallback;
}

/**
 * Convenience hook: returns a single setting value with a fallback.
 */
export function useSettingValue(key: string, fallback: string): string {
  const settings = useSiteSettings();
  if (settings === null) return fallback;
  return settings[key] ?? fallback;
}

/**
 * Parse a content value that stores a JSON array (e.g. gallery items, FAQ list).
 * Returns the fallback array if value is missing or invalid JSON.
 */
export function parseJsonArray<T = any>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Imperative refresh — clears the cache so the next hook consumer refetches.
 * Useful after admin saves a change in a different tab and the user navigates
 * back to the public site.
 */
export function refreshSiteContent() {
  contentCache = null;
  contentPromise = null;
  settingsCache = null;
  settingsPromise = null;
}
