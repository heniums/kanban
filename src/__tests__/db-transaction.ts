import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { setDbOverride } from "@/lib/db/client";

const { Pool } = pg;

const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TestTransaction {
  client: pg.PoolClient;
  db: ReturnType<typeof drizzle>;
}

export async function beginTransaction(): Promise<TestTransaction> {
  const client = await testPool.connect();
  await client.query("BEGIN");
  const db = drizzle({ client }) as unknown as ReturnType<typeof drizzle>;
  setDbOverride(db);
  return { client, db };
}

export async function rollbackTransaction(client: pg.PoolClient): Promise<void> {
  await client.query("ROLLBACK");
  setDbOverride(null);
  client.release();
}
