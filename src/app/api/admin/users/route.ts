import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — list all admin users (super_admin only) */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const users = await db.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }],
  });
  return NextResponse.json({ users });
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "FRONT_DESK"]),
});

/** POST /api/admin/users — create a new admin user (super_admin only) */
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const user = await db.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: parsed.data.password, // sandbox — use bcrypt in production
        role: parsed.data.role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    await db.auditLog.create({
      data: { adminId: admin.id, action: "USER_CREATED", entity: "AdminUser", entityId: user.id, details: `Created user ${user.email} (${user.role})` },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("[/api/admin/users POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "FRONT_DESK"]).optional(),
  password: z.string().min(4).optional(),
});

/** PATCH /api/admin/users — update an admin user */
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const data: Record<string, string> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.email) data.email = parsed.data.email.toLowerCase();
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.password) data.passwordHash = parsed.data.password;

    const user = await db.adminUser.update({
      where: { id: parsed.data.id },
      data,
      select: { id: true, email: true, name: true, role: true },
    });

    await db.auditLog.create({
      data: { adminId: admin.id, action: "USER_UPDATED", entity: "AdminUser", entityId: user.id, details: `Updated user ${user.email}` },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("[/api/admin/users PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/users — delete an admin user (cannot delete self) */
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    const user = await db.adminUser.delete({ where: { id }, select: { email: true } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "USER_DELETED", entity: "AdminUser", entityId: id, details: `Deleted user ${user.email}` },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/users DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
