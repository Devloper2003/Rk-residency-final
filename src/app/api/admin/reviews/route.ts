import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await db.review.findMany({ orderBy: [{ createdAt: "desc" }] });
  return NextResponse.json({ reviews });
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, action } = body as { id: string; action: "APPROVE" | "HIDE" };
    const review = await db.review.findUnique({ where: { id } });
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const updated = await db.review.update({
      where: { id },
      data: { approved: action === "APPROVE" },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: action === "APPROVE" ? "REVIEW_APPROVED" : "REVIEW_HIDDEN",
        entity: "Review",
        entityId: review.id,
        details: `Review "${review.title}" ${action === "APPROVE" ? "approved" : "hidden"}`,
      },
    });

    return NextResponse.json({ ok: true, review: updated });
  } catch (e) {
    console.error("[/api/admin/reviews PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
