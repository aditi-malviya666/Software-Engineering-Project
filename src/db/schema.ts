import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB}`;

const pool = postgres(connectionString, {
  max: 1,
  ssl: false,
});

// export const db = drizzle(pool);

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}

const db = globalThis._db || drizzle(pool);

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export { db };
