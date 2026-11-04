import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Marketing Hub — email campaign composer (Resend).
 *
 * POST /api/admin/marketing/email-campaign
 *   body: { action: "test" | "send", subject, message, ctaLabel?, ctaUrl? }
 *
 *   • test → sends ONE email to the owner's own from-address so the owner
 *     can preview exactly what subscribers will receive.
 *   • send → sends to every NewsletterSubscriber (batched, small delay,
 *     hard cap 500 — serverless timeouts). Returns sent/failed counts.
 *
 * Uses the SAME Resend setup as booking confirmations (email_api_key +
 * email_from in Site Settings) — no new credentials, no new tables.
 * Every campaign is audit-logged. Subject + message are validated; the
 * message is escaped line-by-line into the branded HTML template.
 */

const campaignSchema = z.object({
  action: z.enum(["test", "send"]),
  subject: z.string().min(3).max(150),
  message: z.string().min(10).max(5000),
  ctaLabel: z.string().max(60).optional(),
  ctaUrl: z.string().url().optional().or(z.literal("")),
});

/** Escape user text before it goes into the HTML template. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(message: string, ctaLabel?: string, ctaUrl?: string): string {
  const paragraphs = message
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3d3a34;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const cta =
    ctaUrl && ctaLabel
      ? `<p style="margin:22px 0 6px;"><a href="${esc(ctaUrl)}" style="background:#1D5B45;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:999px;font-size:15px;display:inline-block;">${esc(ctaLabel)}</a></p>`
      : "";
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf6ee;">
<div style="max-width:600px;margin:0 auto;padding:28px 20px;">
  <div style="text-align:center;padding-bottom:18px;border-bottom:2px solid #C9A227;">
    <span style="font-size:26px;color:#1D5B45;font-family:Georgia,serif;font-weight:bold;letter-spacing:0.5px;">RK Residency</span>
    <div style="font-size:11px;color:#8a8577;letter-spacing:3px;margin-top:4px;">VRINDAVAN</div>
  </div>
  <div style="padding:26px 6px;font-family:Arial,Helvetica,sans-serif;">
    ${paragraphs}
    ${cta}
  </div>
  <div style="border-top:1px solid #e5dfce;padding-top:16px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0;font-size:12px;color:#8a8577;">RK Residency, Near Shani Dev Mandir, Kailash Nagar, Vrindavan, UP 281121</p>
    <p style="margin:6px 0 0;font-size:12px;color:#8a8577;">📞 +91 9760814931 · <a href="https://www.rkresidencyvrindavan.in" style="color:#1D5B45;">www.rkresidencyvrindavan.in</a></p>
  </div>
</div>
</body></html>`;
}

async function loadEmailConfig(db: any) {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["email_api_key", "email_from", "email_provider"] } },
    select: { key: true, value: true },
  });
  const cfg: Record<string, string> = {};
  rows.forEach((r) => (cfg[r.key] = r.value));
  return { apiKey: cfg.email_api_key, fromEmail: cfg.email_from || "bookings@rkresidencyvrindavan.in", provider: cfg.email_provider || "resend" };
}

async function sendOne(apiKey: string, from: string, to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: (await res.text()).slice(0, 200) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "network" };
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = campaignSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid campaign data", details: parsed.error.flatten() }, { status: 400 });
    }
    const { action, subject, message, ctaLabel, ctaUrl } = parsed.data;

    const { apiKey, fromEmail, provider } = await loadEmailConfig(db);
    if (provider !== "resend" || !apiKey) {
      return NextResponse.json(
        { error: "Email provider configured nahi hai — Site Settings me email_api_key (Resend) save karein" },
        { status: 409 }
      );
    }

    const html = buildHtml(message, ctaLabel, ctaUrl || undefined);

    if (action === "test") {
      const result = await sendOne(apiKey, `RK Residency <${fromEmail}>`, fromEmail, subject, html);
      if (!result.ok) {
        return NextResponse.json({ error: `Test email fail: ${result.error}` }, { status: 502 });
      }
      return NextResponse.json({ ok: true, testedTo: fromEmail });
    }

    // — action === "send": bulk to every subscriber (hard cap 500) —
    const subs = await db.newsletterSubscriber.findMany({
      select: { email: true },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    if (subs.length === 0) {
      return NextResponse.json({ error: "Koi newsletter subscriber nahi hai" }, { status: 409 });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const sub of subs) {
      const result = await sendOne(apiKey, `RK Residency <${fromEmail}>`, sub.email, subject, html);
      if (result.ok) sent += 1;
      else {
        failed += 1;
        if (errors.length < 5) errors.push(`${sub.email}: ${result.error}`);
      }
      await new Promise((r) => setTimeout(r, 60)); // gentle on the API
    }

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "MARKETING_EMAIL_CAMPAIGN_SENT",
        entity: "NewsletterSubscriber",
        entityId: "campaign",
        details: `"${subject}" → ${sent} sent, ${failed} failed (subscribers: ${subs.length})`,
      },
    });

    return NextResponse.json({ ok: true, sent, failed, total: subs.length, sampleErrors: errors });
  } catch (e) {
    console.error("[/api/admin/marketing/email-campaign POST] error:", e);
    return NextResponse.json({ error: "Campaign send failed" }, { status: 500 });
  }
}
