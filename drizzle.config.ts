import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DB_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB}`,
  },
  migrations: {
    table: "my-migrations-table", // `__drizzle_migrations` by default
    schema: "public", // used in PostgreSQL only, `drizzle` by default
  },
});
