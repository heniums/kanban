import { describe, it, expect, vi, beforeEach } from "vitest";

const capturedPoolConfigs: unknown[] = [];
let poolOnHandlers: Record<string, Array<(client: unknown) => void>> = {};

vi.mock("pg", () => ({
  default: {
    Pool: vi.fn().mockImplementation(function (this: unknown, config: unknown) {
      capturedPoolConfigs.push(config);
      return {
        on: (event: string, handler: (client: unknown) => void) => {
          if (!poolOnHandlers[event]) poolOnHandlers[event] = [];
          poolOnHandlers[event].push(handler);
        },
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
    }),
  },
}));

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(({ client }) => ({ _client: client })),
}));

vi.mock("server-only", () => ({}));

beforeEach(() => {
  capturedPoolConfigs.length = 0;
  poolOnHandlers = {};
  vi.resetModules();
});

async function importClient() {
  const mod = await import("@/lib/db/client");
  mod.setDbOverride(null);
  return mod;
}

describe("connection pool configuration", () => {
  it("creates the pool with max, idleTimeoutMillis, and connectionTimeoutMillis", async () => {
    const { createDbClient } = await importClient();
    createDbClient();

    expect(capturedPoolConfigs).toHaveLength(1);
    const config = capturedPoolConfigs[0] as Record<string, unknown>;
    expect(config.max).toBe(10);
    expect(config.idleTimeoutMillis).toBe(10000);
    expect(config.connectionTimeoutMillis).toBe(10000);
    expect(config.connectionString).toBe(process.env.DATABASE_URL);
  });

  it("registers a connect handler that sets statement_timeout", async () => {
    const { createDbClient } = await importClient();
    createDbClient();

    expect(poolOnHandlers.connect).toBeDefined();
    expect(poolOnHandlers.connect.length).toBeGreaterThan(0);
    const fakeClient = { query: vi.fn() };
    poolOnHandlers.connect[0](fakeClient);
    expect(fakeClient.query).toHaveBeenCalled();
    const sql = fakeClient.query.mock.calls[0][0] as string;
    expect(sql).toContain("statement_timeout");
  });
});
