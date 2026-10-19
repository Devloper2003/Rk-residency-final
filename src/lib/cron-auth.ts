/**
 * cron-auth.ts — authentication for /api/cron/* routes.
 *
 * Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when
 * the CRON_SECRET environment variable is configured on the project, so the
 * scheduled endpoints verify exactly that. The owner's admin session is also
 * accepted so the "Run scheduler now" button in the admin panel can trigger
 * the same logic on demand.
 *
 * The secret lives ONLY in environment variables — it is never exposed to
 * the client, never logged, and never hardcoded.
 */
import { verifyAdmin } from "@/lib/admin-auth";

export async function verifyCronOrAdmin(req: Request): Promise<{ via: "cron" | "admin" } | null> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  const altHeader = req.headers.get("x-cron-secret") || "";

  if (secret && (auth === `Bearer ${secret}` || altHeader === secret)) {
    return { via: "cron" };
  }

  const admin = await verifyAdmin(req);
  if (admin) return { via: "admin" };

  return null;
}
