import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Fail loudly at first DB use rather than at import time, so the app can
  // still build / render static pages before a database is provisioned.
  console.warn("[db] DATABASE_URL is not set — database calls will fail.");
}

// Reuse the client across hot reloads in dev.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString ?? "postgres://invalid", {
    prepare: false,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
