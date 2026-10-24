/**
 * One-time fix: Update the canonical_base_url site setting in the database
 * from the old legacy domain (rkresidency.in) to the correct domain
 * (www.rkresidencyvrindavan.in).
 *
 * Run: npx tsx scripts/fix-canonical-domain.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const OLD_URL = "https://rkresidency.in";
const NEW_URL = "https://www.rkresidencyvrindavan.in";

async function main() {
  console.log(`Checking canonical_base_url in site settings...`);

  const setting = await db.siteSetting.findUnique({
    where: { key: "canonical_base_url" },
  });

  if (!setting) {
    console.log("No canonical_base_url setting found in DB. Nothing to fix.");
    return;
  }

  console.log(`Current value: "${setting.value}"`);

  if (setting.value === OLD_URL || setting.value.includes("rkresidency.in") && !setting.value.includes("rkresidencyvrindavan.in")) {
    const updated = await db.siteSetting.update({
      where: { key: "canonical_base_url" },
      data: { value: NEW_URL },
    });
    console.log(`✅ Updated canonical_base_url to: "${updated.value}"`);
  } else if (setting.value === NEW_URL) {
    console.log("✅ canonical_base_url is already correct.");
  } else {
    console.log(`⚠️ canonical_base_url is "${setting.value}" — not the expected old or new value. Skipping auto-fix.`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
