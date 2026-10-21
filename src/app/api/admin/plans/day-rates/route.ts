import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Day-wise pricing for a rate plan (PlanDayRate model).
 *
 * GET    /api/admin/plans/day-rates?planId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *          → { rates: [{ id, date, price, note }], plan }
 * POST   { planId, date, price, note? }            → set one day (price 0 = remove override)
 *        { planId, from, to, price, onlyDays?: "weekend" | "all" } → bulk range
 *        { planId, from, to, reset: true }         → clear overrides in range
 * DELETE /api/admin/plans/day-rates?id=...         → remove one override
 */

const upsertSchema = z.object({
  planId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().int().min(0).max(1_000_000),
  note: z.string().max(200).optional().or(z.literal("")),
});

const bulkSchema = z.object({
  planId: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().int().min(0).max(1_000_000).optional(),
  onlyDays: z.enum(["all", "weekend"]).default("all"),
  reset: z.boolean().optional(),
});

async function planAudit(adminId: string, action: string, planId: string, details: string) {
  await db.auditLog.create({
    data: { adminId, action, entity: "PlanDayRate", entityId: planId, details },
  });
}

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const planId = url.searchParams.get("planId");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (!planId || !startDate || !endDate) {
    return NextResponse.json({ error: "planId, startDate, endDate required" }, { status: 400 });
  }

  const plan = await db.ratePlan.findUnique({
    where: { id: planId },
    select: { id: true, code: true, name: true, pricePerNight: true, isActive: true },
  });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const rates = await db.planDayRate.findMany({
    where: {
      planId,
      date: {
        gte: new Date(`${startDate}T00:00:00Z`),
        lte: new Date(`${endDate}T23:59:59Z`),
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    plan,
    rates: rates.map((r) => ({
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      price: r.price,
      note: r.note,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // ── Bulk range (set or reset) ──
    if (body?.from && body?.to) {
      const parsed = bulkSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
      }
      const { planId, from, to, price, onlyDays, reset } = parsed.data;

      const plan = await db.ratePlan.findUnique({ where: { id: planId }, select: { code: true } });
      if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

      const fromDate = new Date(`${from}T00:00:00Z`);
      const toDate = new Date(`${to}T00:00:00Z`);
      if (toDate < fromDate) {
        return NextResponse.json({ error: "'to' must be on or after 'from'" }, { status: 400 });
      }
      if (toDate.getTime() - fromDate.getTime() > 366 * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: "Range too long (max 366 days)" }, { status: 400 });
      }

      const dates: Date[] = [];
      const cur = new Date(fromDate);
      while (cur <= toDate) {
        if (onlyDays !== "weekend" || [0, 6].includes(cur.getUTCDay())) {
          dates.push(new Date(cur));
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      if (reset) {
        const res = await db.planDayRate.deleteMany({
          where: { planId, date: { gte: fromDate, lte: toDate } },
        });
        await planAudit(admin.id, "DAY_RATES_RESET", planId, `${plan.code}: cleared ${res.count} day rates ${from}→${to}`);
        return NextResponse.json({ ok: true, count: res.count, reset: true });
      }

      if (price === undefined || price <= 0) {
        return NextResponse.json({ error: "price required for bulk set" }, { status: 400 });
      }

      // Upsert each date in the range.
      let count = 0;
      for (const d of dates) {
        await db.planDayRate.upsert({
          where: { planId_date: { planId, date: d } },
          create: { planId, date: d, price },
          update: { price },
        });
        count++;
      }
      await planAudit(admin.id, "DAY_RATES_BULK_SET", planId, `${plan.code}: set ₹${price}/night for ${count} days ${from}→${to}${onlyDays === "weekend" ? " (weekends only)" : ""}`);
      return NextResponse.json({ ok: true, count });
    }

    // ── Single day upsert (price 0 = remove override) ──
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const { planId, date, price, note } = parsed.data;
    const dateObj = new Date(`${date}T00:00:00Z`);

    if (price === 0) {
      await db.planDayRate.deleteMany({ where: { planId, date: dateObj } });
      await planAudit(admin.id, "DAY_RATE_REMOVED", planId, `${date}: reverted to plan base price`);
      return NextResponse.json({ ok: true, removed: true });
    }

    const rate = await db.planDayRate.upsert({
      where: { planId_date: { planId, date: dateObj } },
      create: { planId, date: dateObj, price, note: note || null },
      update: { price, note: note || null },
    });
    await planAudit(admin.id, "DAY_RATE_SET", planId, `${date}: ₹${price}/night${note ? ` (${note})` : ""}`);
    return NextResponse.json({ ok: true, rate: { id: rate.id, date, price } });
  } catch (e) {
    console.error("[/api/admin/plans/day-rates POST] error:", e);
    return NextResponse.json({ error: "Failed to save day rate" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await db.planDayRate.delete({ where: { id } });
    await planAudit(admin.id, "DAY_RATE_REMOVED", id, `Removed day rate ${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/plans/day-rates DELETE] error:", e);
    return NextResponse.json({ error: "Failed to remove day rate" }, { status: 500 });
  }
}
