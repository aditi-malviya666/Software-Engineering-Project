import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const pool = postgres({
  max: 1,
  ssl: false,
  host: "localhost",
  database: process.env.POSTGRES_DB!,
  port: +process.env.POSTGRES_PORT!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
});

export const db = drizzle(pool);

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}

const db = globalThis._db || drizzle(pool);

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export { db };
