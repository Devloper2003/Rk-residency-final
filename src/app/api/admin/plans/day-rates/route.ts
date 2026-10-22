import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Day-wise pricing + open/close for a rate plan (PlanDayRate model).
 *
 * GET    /api/admin/plans/day-rates?planId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *          → { rates: [{ id, date, price, priceSingle, extraAdultPrice,
 *                        extraChildPrice, isClosed, note }], plan }
 * POST   { planId, date, price?, priceSingle?, extraAdultPrice?, extraChildPrice?,
 *          isClosed?, note?, reset? }                                 → one day
 *        { planId | roomId, from, to, price?, priceSingle?, extraAdultPrice?,
 *          extraChildPrice?, isClosed?, onlyDays?, reset? }            → bulk range
 * DELETE /api/admin/plans/day-rates?id=...                           → remove one row
 *
 * Field semantics (channel-manager style):
 *   price           = DOUBLE (2-person) rate for the day   (0/absent = plan base)
 *   priceSingle     = 1-person rate for the day            (null = plan default)
 *   extraAdultPrice = per-extra-adult rate for the day     (null = plan default)
 *   extraChildPrice = per-child rate for the day           (null = plan default)
 *   isClosed        = true → plan NOT sellable that day (🚫) even if the room is open
 *   reset           = delete the day rows entirely (back to plan defaults)
 * When `roomId` is used for a bulk set instead of `planId`, every ACTIVE plan
 * of that room gets the same values (leave a field out to skip it).
 */

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const priceField = z.number().int().min(0).max(1_000_000).nullable().optional();

const upsertSchema = z.object({
  planId: z.string().min(1),
  date: dateStr,
  price: priceField,
  priceSingle: priceField,
  extraAdultPrice: priceField,
  extraChildPrice: priceField,
  isClosed: z.boolean().optional(),
  note: z.string().max(200).optional().or(z.literal("")),
  reset: z.boolean().optional(),
});

const bulkSchema = z.object({
  planId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  from: dateStr,
  to: dateStr,
  price: priceField,
  priceSingle: priceField,
  extraAdultPrice: priceField,
  extraChildPrice: priceField,
  isClosed: z.boolean().optional(),
  onlyDays: z.enum(["all", "weekend"]).default("all"),
  reset: z.boolean().optional(),
});

async function planAudit(adminId: string, action: string, planId: string, details: string) {
  await db.auditLog.create({
    data: { adminId, action, entity: "PlanDayRate", entityId: planId, details },
  });
}

/** Build the Prisma update/create payload from the provided fields only. */
function dayData(body: { price?: number | null; priceSingle?: number | null; extraAdultPrice?: number | null; extraChildPrice?: number | null; isClosed?: boolean; note?: string }) {
  const data: Record<string, unknown> = {};
  // 0 = "use plan default" → store null so the plan base applies again.
  if (body.price !== undefined) data.price = body.price && body.price > 0 ? body.price : 0;
  if (body.priceSingle !== undefined) data.priceSingle = body.priceSingle && body.priceSingle > 0 ? body.priceSingle : null;
  if (body.extraAdultPrice !== undefined) data.extraAdultPrice = body.extraAdultPrice && body.extraAdultPrice > 0 ? body.extraAdultPrice : null;
  if (body.extraChildPrice !== undefined) data.extraChildPrice = body.extraChildPrice && body.extraChildPrice > 0 ? body.extraChildPrice : null;
  if (body.isClosed !== undefined) data.isClosed = body.isClosed;
  if (body.note !== undefined) data.note = body.note || null;
  return data;
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
    select: {
      id: true, code: true, name: true, pricePerNight: true,
      priceSingle: true, extraAdultPrice: true, extraChildPrice: true, isActive: true,
    },
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
      priceSingle: r.priceSingle,
      extraAdultPrice: r.extraAdultPrice,
      extraChildPrice: r.extraChildPrice,
      isClosed: r.isClosed,
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
      const { from, to, onlyDays, reset } = parsed.data;
      const hasValue = (v?: number | null) => v !== undefined && v !== null && v > 0;
      const setsAnything =
        reset ||
        parsed.data.isClosed !== undefined ||
        hasValue(parsed.data.price) ||
        hasValue(parsed.data.priceSingle) ||
        hasValue(parsed.data.extraAdultPrice) ||
        hasValue(parsed.data.extraChildPrice);
      if (!setsAnything) {
        return NextResponse.json({ error: "Provide at least one price or open/close state" }, { status: 400 });
      }

      // Resolve the target plans: one plan, or every active plan of a room.
      let planIds: string[] = [];
      let codeLabel = "";
      if (parsed.data.planId) {
        const plan = await db.ratePlan.findUnique({ where: { id: parsed.data.planId }, select: { id: true, code: true } });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        planIds = [plan.id];
        codeLabel = plan.code;
      } else if (parsed.data.roomId) {
        const plans = await db.ratePlan.findMany({
          where: { roomId: parsed.data.roomId, isActive: true },
          select: { id: true, code: true },
        });
        if (plans.length === 0) return NextResponse.json({ error: "Room has no active plans" }, { status: 404 });
        planIds = plans.map((p) => p.id);
        codeLabel = `${plans.length} plans of room`;
      } else {
        return NextResponse.json({ error: "planId or roomId required" }, { status: 400 });
      }

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
          where: { planId: { in: planIds }, date: { gte: fromDate, lte: toDate } },
        });
        await planAudit(admin.id, "DAY_RATES_RESET", planIds[0], `${codeLabel}: cleared ${res.count} day rates ${from}→${to}`);
        return NextResponse.json({ ok: true, count: res.count, reset: true });
      }

      const payload = dayData(parsed.data);
      let count = 0;
      for (const planId of planIds) {
        for (const d of dates) {
          await db.planDayRate.upsert({
            where: { planId_date: { planId, date: d } },
            create: { planId, date: d, price: 0, ...payload },
            update: payload,
          });
          count++;
        }
      }
      const bits = [
        parsed.data.price ? `₹${parsed.data.price} (2p)` : null,
        parsed.data.priceSingle ? `₹${parsed.data.priceSingle} (1p)` : null,
        parsed.data.extraAdultPrice ? `+₹${parsed.data.extraAdultPrice}/adult` : null,
        parsed.data.extraChildPrice ? `+₹${parsed.data.extraChildPrice}/child` : null,
        parsed.data.isClosed === true ? "CLOSED" : parsed.data.isClosed === false ? "reopened" : null,
      ].filter(Boolean).join(", ");
      await planAudit(admin.id, "DAY_RATES_BULK_SET", planIds[0], `${codeLabel}: ${bits || "updated"} for ${count} plan-days ${from}→${to}${onlyDays === "weekend" ? " (weekends only)" : ""}`);
      return NextResponse.json({ ok: true, count });
    }

    // ── Single day upsert ──
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const { planId, date, note, reset } = parsed.data;
    const dateObj = new Date(`${date}T00:00:00Z`);

    const plan = await db.ratePlan.findUnique({
      where: { id: planId },
      select: { code: true, pricePerNight: true },
    });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    if (reset) {
      await db.planDayRate.deleteMany({ where: { planId, date: dateObj } });
      await planAudit(admin.id, "DAY_RATE_REMOVED", planId, `${plan.code} ${date}: reset to plan defaults`);
      return NextResponse.json({ ok: true, removed: true });
    }

    // Legacy quick path: price 0 with nothing else → remove the override row.
    const onlyPriceZero =
      parsed.data.price === 0 &&
      parsed.data.priceSingle === undefined &&
      parsed.data.extraAdultPrice === undefined &&
      parsed.data.extraChildPrice === undefined &&
      parsed.data.isClosed === undefined;
    if (onlyPriceZero) {
      await db.planDayRate.deleteMany({ where: { planId, date: dateObj } });
      await planAudit(admin.id, "DAY_RATE_REMOVED", planId, `${plan.code} ${date}: reverted to plan base price`);
      return NextResponse.json({ ok: true, removed: true });
    }

    const data = dayData({ ...parsed.data, note: note || "" });

    // Reopen shortcut: isClosed=false and no other field → if the row carries
    // no real overrides any more, delete it entirely (keeps the table clean).
    const touched = Object.keys(data);
    if (parsed.data.isClosed === false && touched.length === 1) {
      const existing = await db.planDayRate.findUnique({
        where: { planId_date: { planId, date: dateObj } },
        select: { price: true, priceSingle: true, extraAdultPrice: true, extraChildPrice: true, note: true },
      });
      if (existing) {
        const hasOverride =
          (existing.price != null && existing.price > 0 && existing.price !== plan.pricePerNight) ||
          existing.priceSingle != null ||
          existing.extraAdultPrice != null ||
          existing.extraChildPrice != null ||
          !!existing.note;
        if (!hasOverride) {
          await db.planDayRate.delete({ where: { planId_date: { planId, date: dateObj } } });
          await planAudit(admin.id, "PLAN_DAY_REOPENED", planId, `${plan.code} ${date}: reopened (defaults)`);
          return NextResponse.json({ ok: true, removed: true, reopened: true });
        }
      }
    }

    const rate = await db.planDayRate.upsert({
      where: { planId_date: { planId, date: dateObj } },
      create: { planId, date: dateObj, price: 0, ...data },
      update: data,
    });
    await planAudit(
      admin.id,
      parsed.data.isClosed === true ? "PLAN_DAY_CLOSED" : "DAY_RATE_SET",
      planId,
      `${plan.code} ${date}: ${parsed.data.isClosed === true ? "CLOSED" : ""}` +
        [parsed.data.price != null ? `2p ₹${parsed.data.price}` : null,
         parsed.data.priceSingle != null ? `1p ₹${parsed.data.priceSingle}` : null,
         parsed.data.extraAdultPrice != null ? `+A ₹${parsed.data.extraAdultPrice}` : null,
         parsed.data.extraChildPrice != null ? `+C ₹${parsed.data.extraChildPrice}` : null].filter(Boolean).join(", ")
    );
    return NextResponse.json({
      ok: true,
      rate: {
        id: rate.id, date, price: rate.price, priceSingle: rate.priceSingle,
        extraAdultPrice: rate.extraAdultPrice, extraChildPrice: rate.extraChildPrice,
        isClosed: rate.isClosed,
      },
    });
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
