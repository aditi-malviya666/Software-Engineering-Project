import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "./auth-schema";

/**
 * QuestionPapers table stores test paper configurations.
 */
export const questionPapers = pgTable("question_papers", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  timeLimit: integer().notNull(),
});

export type QuestionPaper = InferSelectModel<typeof questionPapers>;
