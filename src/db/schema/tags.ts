import { InferSelectModel } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

/**
 * Tags table stores category labels for question papers.
 */
export const tags = pgTable("tags", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  label: text().notNull(),
});

export type Tag = InferSelectModel<typeof tags>;
