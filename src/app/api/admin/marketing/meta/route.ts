import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  getMetaSetting, putMetaSetting, deleteMetaSetting,
  publishPagePost, publishInstagram,
} from "@/lib/meta-marketing";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Marketing → Meta (Facebook + Instagram) — status / publish / disconnect.
 *
 * GET     → { configured, connected, user, page, instagram, tokenExpires }
 * POST    → { action: "save_credentials" | "publish_facebook" | "publish_instagram", ... }
 * DELETE  → disconnect (removes tokens; keeps App ID/Secret for quick re-login)
 *
 * All state lives in the existing SiteSetting table — zero schema change.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appId = await getMetaSetting(db, "meta_app_id");
  const appSecret = await getMetaSetting(db, "meta_app_secret");
  const pageId = await getMetaSetting(db, "meta_page_id");
  const pageToken = await getMetaSetting(db, "meta_page_token");
  const userToken = await getMetaSetting(db, "meta_user_token");

  return NextResponse.json({
    configured: Boolean(appId && appSecret),
    connected: Boolean(pageId && (pageToken || userToken)),
    user: { name: await getMetaSetting(db, "meta_user_name") },
    page: { id: pageId, name: await getMetaSetting(db, "meta_page_name") },
    instagram: {
      id: await getMetaSetting(db, "meta_ig_id"),
      username: await getMetaSetting(db, "meta_ig_username"),
    },
    tokenExpires: await getMetaSetting(db, "meta_user_token_expires"),
    appMasked: appId ? `${appId.slice(0, 4)}••••${appId.slice(-4)}` : "",
  });
}

const saveCredentialsSchema = z.object({
  action: z.literal("save_credentials"),
  appId: z.string().min(5),
  appSecret: z.string().min(10),
});

const publishFbSchema = z.object({
  action: z.literal("publish_facebook"),
  message: z.string().min(1).max(5000),
  link: z.string().url().optional().or(z.literal("")),
});

const publishIgSchema = z.object({
  action: z.literal("publish_instagram"),
  imageUrl: z.string().url(),
  caption: z.string().max(2200).default(""),
});

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = z.union([saveCredentialsSchema, publishFbSchema, publishIgSchema]).safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    if (body.action === "save_credentials") {
      await putMetaSetting(db, "meta_app_id", body.appId.trim());
      await putMetaSetting(db, "meta_app_secret", body.appSecret.trim());
      await db.auditLog.create({
        data: { adminId: admin.id, action: "MARKETING_META_CREDENTIALS_SAVED", entity: "SiteSetting", entityId: "meta_app_id", details: "Meta App ID/Secret saved for Facebook+Instagram login" },
      });
      return NextResponse.json({ ok: true, configured: true });
    }

    if (body.action === "publish_facebook") {
      const pageId = await getMetaSetting(db, "meta_page_id");
      const pageToken = await getMetaSetting(db, "meta_page_token");
      if (!pageId || !pageToken) return NextResponse.json({ error: "Facebook Page connected nahi hai — pehle login karein" }, { status: 409 });
      const res = await publishPagePost(pageId, pageToken, body.message, body.link || undefined);
      if (!res.ok) {
        const msg = res.data?.error?.message || `Facebook post failed (${res.status})`;
        console.error("[meta publish_facebook]", res.data);
        return NextResponse.json({ error: msg.slice(0, 300) }, { status: 502 });
      }
      await db.auditLog.create({
        data: { adminId: admin.id, action: "MARKETING_FB_POST_PUBLISHED", entity: "SiteSetting", entityId: pageId, details: `Posted to Facebook Page (${await getMetaSetting(db, "meta_page_name")})` },
      });
      return NextResponse.json({ ok: true, postId: res.data?.id || "" });
    }

    // publish_instagram
    const igId = await getMetaSetting(db, "meta_ig_id");
    const pageToken = await getMetaSetting(db, "meta_page_token");
    if (!igId || !pageToken) return NextResponse.json({ error: "Instagram account connected nahi hai — Facebook Page se linked professional IG account chahiye" }, { status: 409 });
    const res = await publishInstagram(igId, pageToken, body.imageUrl, body.caption || "");
    if (!res.ok) {
      const msg = res.data?.error?.message || `Instagram publish failed at "${res.step}" (${res.status})`;
      console.error("[meta publish_instagram]", res.data);
      return NextResponse.json({ error: msg.slice(0, 300) }, { status: 502 });
    }
    await db.auditLog.create({
      data: { adminId: admin.id, action: "MARKETING_IG_POST_PUBLISHED", entity: "SiteSetting", entityId: igId, details: `Posted to Instagram @${await getMetaSetting(db, "meta_ig_username")}` },
    });
    return NextResponse.json({ ok: true, postId: res.data?.id || "" });
  } catch (e) {
    console.error("[/api/admin/marketing/meta POST] error:", e);
    return NextResponse.json({ error: "Marketing action failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    for (const key of [
      "meta_oauth_state", "meta_user_token", "meta_user_token_expires",
      "meta_user_name", "meta_page_id", "meta_page_name", "meta_page_token",
      "meta_ig_id", "meta_ig_username",
    ]) {
      await deleteMetaSetting(db, key);
    }
    await db.auditLog.create({
      data: { adminId: admin.id, action: "MARKETING_META_DISCONNECTED", entity: "SiteSetting", entityId: "meta", details: "Facebook+Instagram disconnected (App credentials kept)" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/marketing/meta DELETE] error:", e);
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
