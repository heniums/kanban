import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { beginTransaction, rollbackTransaction } from "./db-transaction";
import type pg from "pg";

afterEach(() => {
  cleanup();
});

// Apply transaction rollback for node environment tests (tests that don't use jsdom)
if (typeof globalThis.document === "undefined") {
  let testClient: pg.PoolClient | null = null;

  beforeEach(async () => {
    const tx = await beginTransaction();
    testClient = tx.client;
  });

  afterEach(async () => {
    if (testClient) {
      await rollbackTransaction(testClient);
      testClient = null;
    }
  });
}
