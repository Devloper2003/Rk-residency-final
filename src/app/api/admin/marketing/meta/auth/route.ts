import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  getMetaSetting, putMetaSetting, makeState, buildAuthUrl, metaRedirectUri, META_SCOPES,
} from "@/lib/meta-marketing";

export const dynamic = "force-dynamic";

/**
 * Marketing → Meta (Facebook + Instagram) OAuth — STEP 1.
 *
 * GET /api/admin/marketing/meta/auth
 *   → { configured, authUrl?, redirectUri, scopes }
 *
 * The Marketing tab's "Login with Facebook & Instagram" button redirects the
 * whole tab to authUrl (Meta requires a real top-level redirect; popups are
 * unreliable). The callback route exchanges the code and bounces back to
 * /admin?tab=marketing with the result.
 *
 * Credentials live in SiteSetting (meta_app_id / meta_app_secret) — entered
 * once by the owner in the Marketing tab. Until then this returns
 * configured:false and the UI shows the setup guide with the exact
 * redirectUri to register in the Meta App dashboard.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const appId = await getMetaSetting(db, "meta_app_id");
    const appSecret = await getMetaSetting(db, "meta_app_secret");
    const redirectUri = metaRedirectUri(req);
    const configured = Boolean(appId && appSecret);

    if (!configured) {
      return NextResponse.json({ configured: false, redirectUri, scopes: META_SCOPES });
    }

    // Single-use CSRF state (10-minute TTL), verified in the callback.
    const state = makeState();
    await putMetaSetting(db, "meta_oauth_state", state);

    return NextResponse.json({ configured: true, authUrl: buildAuthUrl(appId, redirectUri, state), redirectUri, scopes: META_SCOPES });
  } catch (e) {
    console.error("[/api/admin/marketing/meta/auth] error:", e);
    return NextResponse.json({ error: "Failed to start Meta login" }, { status: 500 });
  }
}
