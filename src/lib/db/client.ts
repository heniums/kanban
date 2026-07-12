import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _overrideDb: ReturnType<typeof drizzle> | null = null;
let _dbProxy: ReturnType<typeof drizzle> | null = null;
let _overrideDbProxy: ReturnType<typeof drizzle> | null = null;

function createDbProxy(target: ReturnType<typeof drizzle>): ReturnType<typeof drizzle> {
  return new Proxy(target, {
    get(target, prop) {
      const currentDb = _overrideDb ?? target;

      if (prop === "transaction" && _overrideDb) {
        return async (fn: (tx: typeof _overrideDb) => Promise<unknown>) => {
          return fn(_overrideDb);
        };
      }

      const value = (currentDb as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof value === "function") {
        return value.bind(currentDb);
      }
      return value;
    },
  }) as ReturnType<typeof drizzle>;
}

export function createDbClient() {
  if (_overrideDb) {
    if (!_overrideDbProxy) {
      _overrideDbProxy = createDbProxy(_overrideDb);
    }
    return _overrideDbProxy;
  }

  if (!_dbProxy) {
    if (!_db) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.DB_POOL_MAX ?? 10),
        idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT ?? 10000),
        connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT ?? 10000),
      });

      // Apply statement_timeout on every new connection (per-query abort threshold)
      const statementTimeoutMs = Number(process.env.DB_STATEMENT_TIMEOUT ?? 30000);
      pool.on("connect", (client) => {
        client.query(`SET statement_timeout = ${statementTimeoutMs}`);
      });

      // Lightweight slow-query instrumentation (logs queries slower than threshold)
      const slowThresholdMs = Number(process.env.DB_SLOW_QUERY_THRESHOLD ?? 500);
      if (slowThresholdMs > 0) {
        const originalQuery = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;
        (pool as unknown as { query: (...args: unknown[]) => Promise<unknown> }).query = (
          ...args: unknown[]
        ) => {
          const start = Date.now();
          const text = typeof args[0] === "string" ? args[0] : "[prepared]";
          return originalQuery(...args).then((res: unknown) => {
            const elapsed = Date.now() - start;
            if (elapsed >= slowThresholdMs) {
              console.warn(`[slow-query] ${elapsed}ms: ${text.slice(0, 120)}`);
            }
            return res;
          });
        };
      }

      _db = drizzle({ client: pool });
    }
    _dbProxy = createDbProxy(_db);
  }
  return _dbProxy;
}

export function setDbOverride(db: ReturnType<typeof drizzle> | null) {
  _overrideDb = db;
  _overrideDbProxy = null;
}
