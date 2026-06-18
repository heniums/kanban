import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./pool.js";

export function createDbClient() {
  return drizzle({ client: pool });
}

export type DbClient = ReturnType<typeof createDbClient>;
