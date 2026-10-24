/**
 * Local build validation with an ISOLATED embedded postgres.
 * Prod database is never touched: prisma db push runs against the temp DB only.
 * Usage: node scripts/build-with-embedded-pg.mjs
 */
import EmbeddedPostgres from "embedded-postgres";
import { spawnSync } from "node:child_process";

const PORT = 55432;
const PGDATA = "/home/z/my-project/tmp-assets/embedded-pg-build";

const pg = new EmbeddedPostgres({
  databaseDir: PGDATA,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: false,
});

async function main() {
  console.log("→ starting embedded postgres on", PORT);
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("rkbuild");

  const env = {
    ...process.env,
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${PORT}/rkbuild`,
    DIRECT_URL: `postgresql://postgres:postgres@127.0.0.1:${PORT}/rkbuild`,
  };

  console.log("→ prisma db push (LOCAL temp DB only)");
  const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    env,
    stdio: "inherit",
    shell: true,
  });
  if (push.status !== 0) throw new Error("db push failed");

  console.log("→ next build");
  const build = spawnSync("npx", ["next", "build"], {
    env,
    stdio: "inherit",
    shell: true,
  });

  console.log(build.status === 0 ? "BUILD OK ✓" : "BUILD FAILED ✗");
  process.exitCode = build.status === 0 ? 0 : 1;
}

main()
  .catch((e) => {
    console.error("VALIDATION ERROR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pg.stop();
      console.log("→ embedded postgres stopped");
    } catch {}
  });
