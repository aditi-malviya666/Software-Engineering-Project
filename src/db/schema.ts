import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? postgres(connectionString, {
      max: 1,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1") ? false : "require",
    })
  : postgres({
      max: 1,
      ssl: false,
      host: "localhost",
      database: process.env.POSTGRES_DB!,
      port: +process.env.POSTGRES_PORT!,
      user: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
    });

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}

const db = globalThis._db || drizzle(pool);

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export { db };
