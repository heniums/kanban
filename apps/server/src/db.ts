import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export function createDbClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return drizzle({ client: pool });
}

export type DbClient = ReturnType<typeof createDbClient>;
