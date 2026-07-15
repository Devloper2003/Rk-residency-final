import { db } from "@/lib/db";

/**
 * Verify the admin session token (sandbox-grade).
 * Reads `rk_admin_session` cookie OR `Authorization: Bearer <token>` header.
 * Returns the admin user or null.
 */
export async function verifyAdmin(req: Request): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
} | null> {
  try {
    let token: string | undefined;
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/rk_admin_session=([^;]+)/);
    if (match) token = match[1];
    if (!token) {
      const auth = req.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!decoded.expires || decoded.expires < Date.now()) return null;

    const admin = await db.adminUser.findUnique({ where: { id: decoded.id } });
    if (!admin) return null;
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  } catch {
    return null;
  }
}
