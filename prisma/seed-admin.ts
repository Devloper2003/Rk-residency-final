// Seed an admin user for the admin panel.
// Default credentials (DEMO ONLY — change in production):
//   email: admin@rkresidency.in
//   password: rk-admin-2026
//
// NOTE: This is a simple plaintext-equivalent hash for the sandbox demo.
// In production, use bcrypt/argon2.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.adminUser.upsert({
    where: { email: "admin@rkresidency.in" },
    create: {
      email: "admin@rkresidency.in",
      name: "Shyam Khandelwal",
      passwordHash: "rk-admin-2026", // sandbox only
      role: "SUPER_ADMIN",
    },
    update: {
      name: "Shyam Khandelwal",
      passwordHash: "rk-admin-2026",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin user seeded: admin@rkresidency.in / rk-admin-2026");

  // Seed a few audit log entries so the audit log view isn't empty
  const admin = await db.adminUser.findUnique({ where: { email: "admin@rkresidency.in" } });
  if (admin && (await db.auditLog.count()) === 0) {
    await db.auditLog.createMany({
      data: [
        { adminId: admin.id, action: "ADMIN_LOGIN", entity: "AdminUser", entityId: admin.id, details: "Initial admin login" },
        { adminId: admin.id, action: "ROOM_RATE_UPDATED", entity: "Room", details: "Yamuna Suite base rate set to ₹14,500" },
        { adminId: admin.id, action: "OFFER_CREATED", entity: "Offer", details: "Janmashtami Devotional Package created" },
        { adminId: admin.id, action: "REVIEW_APPROVED", entity: "Review", details: "5-star review from Anjali Mehta approved" },
      ],
    });
    console.log("Audit log seeded with 4 entries");
  }
}
main().catch(console.error).finally(() => db.$disconnect());
