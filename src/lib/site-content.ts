"use client";

import { useEffect, useState } from "react";

/**
 * In-memory cache shared across all hook consumers on the same page.
 * Avoids refetching /api/site-content when multiple components mount.
 *
 * The cache is keyed by a version number that gets bumped whenever the
 * admin saves a change. The admin tab calls `refreshSiteContent()` after
 * a save; the public site picks up the new version via the
 * `rk_content_version` localStorage event (works across tabs in the
 * same browser) and refetches with a cache-busting query param.
 */
type ContentMap = Record<string, string>;
type SettingsMap = Record<string, string>;

let contentCache: ContentMap | null = null;
let settingsCache: SettingsMap | null = null;
let contentVersion = 0;
let contentPromise: Promise<ContentMap> | null = null;
let settingsPromise: Promise<SettingsMap> | null = null;

const VERSION_KEY = "rk_content_version";

// Read initial version from localStorage so a freshly-loaded public page
// picks up the latest version written by the admin tab.
if (typeof window !== "undefined") {
  try {
    const v = localStorage.getItem(VERSION_KEY);
    if (v) contentVersion = parseInt(v, 10) || 0;
  } catch {}
}

async function fetchContent(): Promise<ContentMap> {
  if (contentCache) return contentCache;
  if (!contentPromise) {
    // Cache-busting query so the browser + any CDN never serves stale JSON.
    contentPromise = fetch(`/api/site-content?v=${contentVersion}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const c: ContentMap = d.content || {};
        contentCache = c;
        return c;
      })
      .catch(() => {
        const c: ContentMap = {};
        contentCache = c;
        return c;
      });
  }
  return contentPromise;
}

async function fetchSettings(): Promise<SettingsMap> {
  if (settingsCache) return settingsCache;
  if (!settingsPromise) {
    settingsPromise = fetch(`/api/site-settings?v=${contentVersion}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: SettingsMap = d.settings || {};
        settingsCache = s;
        return s;
      })
      .catch(() => {
        const s: SettingsMap = {};
        settingsCache = s;
        return s;
      });
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
  const [localVersion, setLocalVersion] = useState(contentVersion);

  useEffect(() => {
    // Pick up version bumps from other tabs (admin tab saved a change).
    const onStorage = (e: StorageEvent) => {
      if (e.key === VERSION_KEY && e.newValue) {
        const v = parseInt(e.newValue, 10) || 0;
        if (v !== contentVersion) {
          contentVersion = v;
          contentCache = null;
          contentPromise = null;
          settingsCache = null;
          settingsPromise = null;
          setLocalVersion(v);
        }
      }
    };
    // Also listen for same-tab saves (admin in same tab as preview — rare but possible).
    const onCustom = () => {
      contentVersion++;
      contentCache = null;
      contentPromise = null;
      settingsCache = null;
      settingsPromise = null;
      setLocalVersion(contentVersion);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("rk-content-updated", onCustom);
    fetchContent().then(setContent);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rk-content-updated", onCustom);
    };
  }, [localVersion]);

  return content;
}

/** Same as useSiteContent but for /api/site-settings. */
export function useSiteSettings(): SettingsMap | null {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [localVersion, setLocalVersion] = useState(contentVersion);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === VERSION_KEY && e.newValue) {
        const v = parseInt(e.newValue, 10) || 0;
        if (v !== contentVersion) {
          contentVersion = v;
          contentCache = null;
          contentPromise = null;
          settingsCache = null;
          settingsPromise = null;
          setLocalVersion(v);
        }
      }
    };
    const onCustom = () => {
      contentVersion++;
      contentCache = null;
      contentPromise = null;
      settingsCache = null;
      settingsPromise = null;
      setLocalVersion(contentVersion);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("rk-content-updated", onCustom);
    fetchSettings().then(setSettings);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rk-content-updated", onCustom);
    };
  }, [localVersion]);

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
 * Imperative refresh — call this from the admin tab after a save.
 * - Bumps the version in localStorage so OTHER tabs (e.g. the public
 *   site open in a different tab) get notified via the `storage` event.
 * - Dispatches a custom event `rk-content-updated` so the SAME tab picks
 *   up the change too (admin preview in the same browser tab).
 * - Clears the in-memory cache so the next fetch refetches fresh data.
 */
export function refreshSiteContent() {
  contentVersion++;
  contentCache = null;
  contentPromise = null;
  settingsCache = null;
  settingsPromise = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(VERSION_KEY, String(contentVersion));
    } catch {}
    window.dispatchEvent(new Event("rk-content-updated"));
  }
}
