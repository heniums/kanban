import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./pool.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function createDbClient() {
  if (!_db) {
    _db = drizzle({ client: pool });
  }
  return _db;
}

export type DbClient = ReturnType<typeof createDbClient>;
