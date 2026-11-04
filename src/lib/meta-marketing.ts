import crypto from "crypto";

/**
 * meta-marketing.ts — shared helpers for the Marketing tab's Facebook +
 * Instagram (Meta) integration. Used by:
 *   /api/admin/marketing/meta/auth
 *   /api/admin/marketing/meta/callback
 *   /api/admin/marketing/meta
 *
 * Everything persists in the existing SiteSetting table (key/value) —
 * ZERO schema change, ZERO impact on other data:
 *   meta_app_id              — Meta App ID (public)
 *   meta_app_secret          — Meta App Secret (write-only, masked in UI)
 *   meta_oauth_state         — single-use CSRF state with expiry
 *   meta_user_token          — long-lived user access token (~60 days)
 *   meta_user_token_expires  — ISO date the user token expires
 *   meta_user_name           — Facebook user name shown in the console
 *   meta_page_id             — connected Facebook Page id
 *   meta_page_name           — connected Facebook Page name
 *   meta_page_token          — long-lived Page access token (no expiry)
 *   meta_ig_id               — linked Instagram professional account id
 *   meta_ig_username         — linked Instagram username
 */

export const GRAPH_VERSION = "v21.0";

// Read pages + IG accounts AND allow publishing once connected.
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export const META_SETTING_KEYS = [
  "meta_app_id",
  "meta_app_secret",
  "meta_oauth_state",
  "meta_user_token",
  "meta_user_token_expires",
  "meta_user_name",
  "meta_page_id",
  "meta_page_name",
  "meta_page_token",
  "meta_ig_id",
  "meta_ig_username",
] as const;

/** Keys that must never be returned verbatim to the browser. */
export const META_SECRET_KEYS = new Set([
  "meta_app_secret",
  "meta_oauth_state",
  "meta_user_token",
  "meta_page_token",
]);

export function metaRedirectUri(req: Request): string {
  // Trust the proxy headers (Vercel) so the URI matches what the browser sees.
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "www.rkresidencyvrindavan.in";
  return `${proto}://${host}/api/admin/marketing/meta/callback`;
}

export async function getMetaSetting(db: any, key: string): Promise<string> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value || "";
}

export async function putMetaSetting(db: any, key: string, value: string): Promise<void> {
  const labels: Record<string, string> = {
    meta_app_id: "Meta App ID (Facebook/Instagram login)",
    meta_app_secret: "Meta App Secret (write-only)",
    meta_oauth_state: "Meta OAuth state (internal)",
    meta_user_token: "Meta user access token (internal)",
    meta_user_token_expires: "Meta user token expiry",
    meta_user_name: "Facebook account name",
    meta_page_id: "Connected Facebook Page ID",
    meta_page_name: "Connected Facebook Page name",
    meta_page_token: "Facebook Page access token (internal)",
    meta_ig_id: "Linked Instagram account ID",
    meta_ig_username: "Linked Instagram username",
  };
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value, label: labels[key] || key, category: "marketing" },
    update: { value },
  });
}

export async function deleteMetaSetting(db: any, key: string): Promise<void> {
  try {
    await db.siteSetting.delete({ where: { key } });
  } catch {
    /* not set — nothing to delete */
  }
}

/** Single-use CSRF state: <random>:<expiryMs>. */
export function makeState(): string {
  return `${crypto.randomBytes(24).toString("hex")}:${Date.now() + 10 * 60 * 1000}`;
}

export function verifyState(saved: string, received: string | null): boolean {
  if (!saved || !received) return false;
  const [rand, expiry] = saved.split(":");
  const [rRand] = received.split(":");
  if (!rand || rand !== rRand) return false;
  const exp = Number(expiry);
  return Number.isFinite(exp) && Date.now() <= exp;
}

export function buildAuthUrl(appId: string, redirectUri: string, state: string): string {
  return (
    `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(META_SCOPES)}` +
    `&response_type=code`
  );
}

async function graph(path: string, params: Record<string, string>, method: "GET" | "POST" = "GET") {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { method, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data } as { ok: boolean; status: number; data: any };
}

/** Short code → long-lived user token (~60 days). */
export function exchangeCode(appId: string, appSecret: string, redirectUri: string, code: string) {
  return graph("oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
}

/** Exchange a short-lived token for a ~60-day one. */
export function extendToken(appId: string, appSecret: string, shortToken: string) {
  return graph("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
}

/** Facebook pages this user can manage (with their tokens). */
export function fetchPages(userToken: string) {
  return graph("me/accounts", {
    access_token: userToken,
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: "50",
  });
}

/** Publish a feed post to the connected Facebook Page. */
export function publishPagePost(pageId: string, pageToken: string, message: string, link?: string) {
  return graph(`${pageId}/feed`, { access_token: pageToken, message, ...(link ? { link } : {}) }, "POST");
}

/**
 * Publish an image post to the linked Instagram professional account:
 * step 1 creates a media container, step 2 publishes it. The image must be
 * a PUBLIC https URL (Media Library URLs qualify).
 */
export async function publishInstagram(igId: string, pageToken: string, imageUrl: string, caption: string) {
  const container = await graph(`${igId}/media`, { access_token: pageToken, image_url: imageUrl, caption }, "POST");
  if (!container.ok || !container.data?.id) {
    return { ok: false, status: container.status, data: container.data, step: "container" as const };
  }
  const publish = await graph(`${igId}/media_publish`, { access_token: pageToken, creation_id: container.data.id }, "POST");
  return { ...publish, step: "publish" as const };
}
