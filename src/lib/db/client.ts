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
      });
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
