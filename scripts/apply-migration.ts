import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const migrationFile = path.resolve(__dirname, "../drizzle/0001_wide_george_stacy.sql");
  const sql = fs.readFileSync(migrationFile, "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      applied++;
    } catch (err) {
      const code = (err as { code?: string }).code;
      const msg = (err as { message?: string }).message ?? "";
      if (code === "42P07" || /already exists/.test(msg)) {
        skipped++;
        continue;
      }
      console.error("Failed statement:", stmt.slice(0, 80));
      throw err;
    }
  }
  await pool.end();
  console.log(`Migration applied: ${applied} statements, ${skipped} skipped (already existed)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
