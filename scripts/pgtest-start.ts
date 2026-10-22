/**
 * Local verification DB — embedded Postgres on port 55432.
 * Usage: bun scripts/pgtest-start.ts [--fresh]
 * Keeps running in foreground; run with & for background use.
 */
import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = "/home/z/my-project/Rk-residency-final/.pgdata-embedded";
const fresh = process.argv.includes("--fresh");

async function main() {
  const fs = await import("fs");
  if (fresh && fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
  const alreadyInitialised = fs.existsSync(DATA_DIR);

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "localtest",
    port: 55432,
    persistent: true,
  });

  if (!alreadyInitialised) {
    await pg.initialise();
    console.log("[pgtest] initialised fresh data dir");
  }
  // Sandbox has no IPv6 loopback — force IPv4 bind before start.
  const confPath = `${DATA_DIR}/postgresql.conf`;
  const conf = fs.readFileSync(confPath, "utf8");
  if (!conf.includes("listen_addresses = '127.0.0.1'")) {
    fs.writeFileSync(confPath, `${conf}\nlisten_addresses = '127.0.0.1'\n`);
    console.log("[pgtest] patched listen_addresses -> 127.0.0.1");
  }
  await pg.start();
  console.log("[pgtest] started on port 55432");
  try {
    await pg.createDatabase("rktest");
    console.log("[pgtest] database rktest created");
  } catch {
    console.log("[pgtest] database rktest already exists");
  }
  console.log("[pgtest] ready — press Ctrl+C to stop");
  // keep alive
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error("[pgtest] failed:", e);
  process.exit(1);
});
