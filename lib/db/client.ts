import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

// Reuse across hot reloads / lambda invocations.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: DB;
};

// Lazily construct the client on first query — NOT at module import. This keeps
// `next build` (which evaluates route modules during page-data collection) from
// parsing DATABASE_URL, so a missing/malformed connection string can't fail the
// build. Any connection problem then surfaces at request time, where callers
// already handle it gracefully.
function getDb(): DB {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client =
    globalForDb.pgClient ??
    postgres(connectionString, { prepare: false, max: 5 });

  if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

  const instance = drizzle(client, { schema });
  globalForDb.drizzleDb = instance;
  return instance;
}

// A thin proxy so existing `db.select()/insert()/execute()` call sites keep
// working while construction stays deferred to first use.
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb() as object;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
