import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * One-time per-process backfill: bookings created before the downloadToken
 * column shipped have a NULL token. Those rows are the only ones still
 * reachable without a token (legacy grace), and the doc/abandon gates rely on
 * tokens existing for NEW rows. Fill the gap lazily (first DB use in any
 * process) so every legacy row also gets a token and the NULL-legacy path
 * disappears over time. gen_random_uuid() is built into PostgreSQL 13+, which
 * Neon runs, so no extension is needed.
 */
const gBackfill = globalThis as unknown as { __RK_TOKEN_BACKFILL__?: Promise<void> }
if (!gBackfill.__RK_TOKEN_BACKFILL__) {
  gBackfill.__RK_TOKEN_BACKFILL__ = db
    .$executeRawUnsafe(
      `UPDATE "Booking" SET "downloadToken" = gen_random_uuid()::text WHERE "downloadToken" IS NULL`
    )
    .then((n) => {
      if (n > 0) console.log(`[db] backfilled downloadToken on ${n} legacy booking(s)`)
    })
    .catch((e) => {
      console.error("[db] downloadToken backfill failed (non-fatal):", e)
    })
}
