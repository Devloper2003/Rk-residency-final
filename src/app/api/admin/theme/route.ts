import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const themes = await db.themeSetting.findMany({ orderBy: [{ key: "asc" }] });
  return NextResponse.json({ themes });
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, value } = await req.json() as { id: string; value: string };
    const theme = await db.themeSetting.update({ where: { id }, data: { value } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "THEME_UPDATED", entity: "ThemeSetting", entityId: theme.id, details: `Updated ${theme.key} = ${value}` },
    });
    return NextResponse.json({ ok: true, theme });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
