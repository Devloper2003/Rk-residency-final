import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [subscribers, messages, auditLogs] = await Promise.all([
    db.newsletterSubscriber.findMany({ orderBy: [{ createdAt: "desc" }] }),
    db.contactMessage.findMany({ orderBy: [{ createdAt: "desc" }] }),
    db.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      include: { admin: { select: { name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({ subscribers, messages, auditLogs });
}
