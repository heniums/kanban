import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;

export function createDbClient() {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle({ client: pool });
  }
  return _db;
}
