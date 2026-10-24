import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/settings — returns all site settings (secrets masked) */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.siteSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  // Never ship secret values to the browser — an XSS, browser extension or
  // shoulder-surf on the admin panel must not expose the Resend/Razorpay
  // keys. The client shows a "configured" badge instead and only ever
  // WRITES new values (write-only secrets).
  const SECRET_KEYS = new Set([
    "email_api_key", "razorpay_key_secret", "razorpay_webhook_secret",
    "stripe_secret_key", "stripe_webhook_secret", "internal_api_secret",
    "whatsapp_api_key", "cron_secret",
  ]);
  const masked = settings.map((s) =>
    SECRET_KEYS.has(s.key)
      ? { ...s, value: s.value ? "••••••••" : "", configured: Boolean(s.value) }
      : { ...s, configured: undefined }
  );
  return NextResponse.json({ settings: masked });
}

/** PATCH /api/admin/settings — update a single setting */
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, value } = body as { id: string; value: string };
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const setting = await db.siteSetting.update({ where: { id }, data: { value } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "SETTING_UPDATED", entity: "SiteSetting", entityId: setting.id, details: `Updated "${setting.key}"` },
    });
    return NextResponse.json({ ok: true, setting });
  } catch (e) {
    console.error("[/api/admin/settings PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
