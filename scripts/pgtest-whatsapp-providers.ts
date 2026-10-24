/**
 * Smoke test — WhatsApp multi-provider notify paths (fake creds).
 * Expected: every provider path executes without crashing and returns false
 * with invalid credentials (providers reject; we assert no exception).
 * Run: DATABASE_URL=... bun scripts/pgtest-whatsapp-providers.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function set(key: string, value: string) {
  await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

async function main() {
  await set("whatsapp_enabled", "true");
  await set("whatsapp_owner_phone", "919999999999");

  const { notifyOwnerWhatsApp } = await import("@/lib/booking-sync");

  // 1. callmebot path with fake key — real HTTP, expected reject
  await set("whatsapp_provider", "callmebot");
  await set("whatsapp_api_key", "fake-key-smoke");
  const cb = await notifyOwnerWhatsApp("smoke test");
  console.log(`callmebot fake-key → ${cb} (expect false, no crash)`);

  // 2. ultramsg path with fake instance/token — real HTTP, expected reject
  await set("whatsapp_provider", "ultramsg");
  await set("whatsapp_ultramsg_instance", "instance_fake");
  const um = await notifyOwnerWhatsApp("smoke test");
  console.log(`ultramsg fake-instance → ${um} (expect false, no crash)`);

  // 3. ultramsg missing instance — config guard
  await set("whatsapp_ultramsg_instance", "");
  const um2 = await notifyOwnerWhatsApp("smoke test");
  console.log(`ultramsg no-instance → ${um2} (expect false, config guard)`);

  // 4. greenapi path with fake instance/token — real HTTP, expected reject
  await set("whatsapp_provider", "greenapi");
  await set("whatsapp_greenapi_instance", "999999");
  const ga = await notifyOwnerWhatsApp("smoke test");
  console.log(`greenapi fake-instance → ${ga} (expect false, no crash)`);

  // 5. disabled → early false
  await set("whatsapp_enabled", "false");
  const off = await notifyOwnerWhatsApp("smoke test");
  console.log(`disabled → ${off} (expect false)`);

  // cleanup — don't leave fake creds around
  for (const k of ["whatsapp_enabled", "whatsapp_api_key"]) await set(k, k === "whatsapp_enabled" ? "false" : "");

  console.log("\nRESULT: all provider paths executed without crash");
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("SMOKE FAIL:", e);
  await db.$disconnect();
  process.exit(1);
});
