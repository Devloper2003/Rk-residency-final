import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/admin/auth/login
 * Body: { email, password }
 * Returns a session token (sandbox: simple signed JWT-equivalent).
 *
 * NOTE: This is a sandbox-grade auth. Production should use NextAuth.js
 * with proper JWT + httpOnly cookies.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!admin || admin.passwordHash !== parsed.data.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Sandbox session token: base64 of adminId + email + expiry
    const expires = Date.now() + 1000 * 60 * 60 * 8; // 8 hours
    const token = Buffer.from(
      JSON.stringify({ id: admin.id, email: admin.email, role: admin.role, expires })
    ).toString("base64");

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "ADMIN_LOGIN",
        entity: "AdminUser",
        entityId: admin.id,
        details: `Login from ${req.headers.get("x-forwarded-for") || "unknown"}`,
      },
    });

    const res = NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
      expires,
    });
    res.cookies.set("rk_admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[/api/admin/auth/login] error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("rk_admin_session");
  return res;
}
