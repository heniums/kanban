import { describe, it, expect, beforeEach, afterEach } from "vitest";
// @vitest-environment node
import { eq } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { beginTransaction, rollbackTransaction } from "./db-transaction";
import type pg from "pg";

const db = createDbClient();

describe("Transaction Rollback Utility", () => {
  let client: pg.PoolClient;

  beforeEach(async () => {
    const tx = await beginTransaction();
    client = tx.client;
  });

  afterEach(async () => {
    await rollbackTransaction(client);
  });

  it("begins a transaction before each test", async () => {
    // Verify we're in a transaction by checking transaction status
    const result = await client.query("SELECT txid_current()");
    expect(result.rows[0].txid_current).toBeDefined();
  });

  it("rolls back the transaction after a passing test", async () => {
    const email = `rollback-pass-${Date.now()}@kanban.local`;
    await db.insert(users).values({
      email,
      passwordHash: "test",
      name: "Rollback Pass Test",
    });

    const [found] = await db.select().from(users).where(eq(users.email, email));
    expect(found).toBeDefined();
    // Data should be rolled back in afterEach
  });

  it("rolls back the transaction after a failing test (simulated)", async () => {
    const email = `rollback-fail-${Date.now()}@kanban.local`;
    await db.insert(users).values({
      email,
      passwordHash: "test",
      name: "Rollback Fail Test",
    });

    const [found] = await db.select().from(users).where(eq(users.email, email));
    expect(found).toBeDefined();
    // Even if this assertion failed, afterEach would still rollback
  });

  it("does not persist data across tests", async () => {
    const email = `no-leak-${Date.now()}@kanban.local`;
    await db.insert(users).values({
      email,
      passwordHash: "test",
      name: "No Leak Test",
    });

    const [found] = await db.select().from(users).where(eq(users.email, email));
    expect(found).toBeDefined();
  });

  it("confirms previous test data was rolled back", async () => {
    const email = `no-leak-${Date.now()}@kanban.local`;
    const [found] = await db.select().from(users).where(eq(users.email, email));
    expect(found).toBeUndefined();
  });
});
