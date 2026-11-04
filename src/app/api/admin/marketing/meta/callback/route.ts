import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getMetaSetting, putMetaSetting, deleteMetaSetting, verifyState, metaRedirectUri,
  exchangeCode, extendToken, fetchPages,
} from "@/lib/meta-marketing";

export const dynamic = "force-dynamic";

/**
 * Marketing → Meta (Facebook + Instagram) OAuth — STEP 2 (callback).
 *
 * Meta redirects here after the owner logs in / picks the page. We:
 *   1. verify the single-use state (CSRF),
 *   2. exchange the code for a short-lived token,
 *   3. extend it to a ~60-day user token,
 *   4. list the pages the user manages; auto-connect the first page that has
 *      a linked Instagram professional account (falls back to the first page),
 *   5. store the long-lived Page token + IG account id/username,
 *   6. redirect back to /admin?tab=marketing&meta=connected|<error>.
 *
 * This route is hit by Meta's redirect (no admin header possible) — security
 * comes from the single-use state created in step 1 by an authenticated
 * admin, and every token write requires that state to verify first.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");
  const origin = `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
  const back = (status: string) => NextResponse.redirect(`${origin}/admin?tab=marketing&meta=${encodeURIComponent(status)}`, { status: 302 });

  if (errorParam) return back(`error: ${errorParam.slice(0, 180)}`);
  if (!code) return back("error: Meta ne code return nahi kiya");

  try {
    const savedState = await getMetaSetting(db, "meta_oauth_state");
    if (!verifyState(savedState, state)) {
      return back("error: State mismatch — login dobara start karein (link 10 minute tak valid hai)");
    }
    await deleteMetaSetting(db, "meta_oauth_state"); // single-use

    const appId = await getMetaSetting(db, "meta_app_id");
    const appSecret = await getMetaSetting(db, "meta_app_secret");
    if (!appId || !appSecret) return back("error: Meta App ID/Secret missing");

    // 1) code → short-lived user token
    const shortRes = await exchangeCode(appId, appSecret, metaRedirectUri(req), code);
    if (!shortRes.ok || !shortRes.data?.access_token) {
      const msg = shortRes.data?.error?.message || `token exchange failed (${shortRes.status})`;
      console.error("[meta callback] exchange failed:", shortRes.data);
      return back(`error: ${msg.slice(0, 180)}`);
    }

    // 2) extend to long-lived (~60 days)
    const longRes = await extendToken(appId, appSecret, shortRes.data.access_token);
    const userToken = longRes.data?.access_token || shortRes.data.access_token;
    const expiresRaw = Number(longRes.data?.expires_in ?? shortRes.data.expires_in ?? 0);
    const expiresIso = expiresRaw > 0 ? new Date(Date.now() + expiresRaw * 1000).toISOString() : "";

    // 3) who logged in
    let userName = "";
    try {
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=name&access_token=${encodeURIComponent(userToken)}`, { cache: "no-store" });
      const me = await meRes.json();
      userName = me?.name || "";
    } catch { /* cosmetic only */ }

    // 4) pages (+ linked IG accounts)
    const pagesRes = await fetchPages(userToken);
    if (!pagesRes.ok || !Array.isArray(pagesRes.data?.data)) {
      const msg = pagesRes.data?.error?.message || `pages fetch failed (${pagesRes.status})`;
      console.error("[meta callback] pages fetch failed:", pagesRes.data);
      return back(`error: ${msg.slice(0, 180)}`);
    }
    const pages: any[] = pagesRes.data.data;
    if (pages.length === 0) {
      return back("error: Koi Facebook Page manage karne ka access nahi mila — pehle Page banaein ya App roles check karein");
    }
    const withIg = pages.find((p) => p.instagram_business_account?.id);
    const chosen = withIg || pages[0];

    // 5) persist everything (long-lived page token has no expiry)
    await putMetaSetting(db, "meta_user_token", userToken);
    if (expiresIso) await putMetaSetting(db, "meta_user_token_expires", expiresIso);
    if (userName) await putMetaSetting(db, "meta_user_name", userName);
    await putMetaSetting(db, "meta_page_id", chosen.id);
    await putMetaSetting(db, "meta_page_name", chosen.name || chosen.id);
    if (chosen.access_token) await putMetaSetting(db, "meta_page_token", chosen.access_token);
    if (chosen.instagram_business_account?.id) {
      await putMetaSetting(db, "meta_ig_id", chosen.instagram_business_account.id);
      if (chosen.instagram_business_account.username) {
        await putMetaSetting(db, "meta_ig_username", chosen.instagram_business_account.username);
      }
    } else {
      // no IG on this page — clear stale IG rows so status stays honest
      await deleteMetaSetting(db, "meta_ig_id");
      await deleteMetaSetting(db, "meta_ig_username");
    }

    console.log(`[meta callback] connected page "${chosen.name}"${withIg ? ` + IG @${chosen.instagram_business_account?.username}` : ""} for admin console`);
    return back(withIg ? "connected" : "connected_no_ig");
  } catch (e) {
    console.error("[/api/admin/marketing/meta/callback] error:", e);
    return back("error: Unexpected server error — dobara try karein");
  }
}
