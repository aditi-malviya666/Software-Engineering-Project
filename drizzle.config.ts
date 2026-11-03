import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/*",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
      }
    : {
        host: "localhost",
        database: process.env.POSTGRES_DB || "project_se",
        port: +(process.env.POSTGRES_PORT || 5432),
        user: process.env.POSTGRES_USER || "se_admin",
        password: process.env.POSTGRES_PASSWORD || "password",
        ssl: false,
      },
  migrations: {
    table: "my-migrations-table",
    schema: "public",
  },
});
