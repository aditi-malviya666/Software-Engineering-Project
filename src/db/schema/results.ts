import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { testSessions } from "./testSession";

/**
 * Results table stores test session outcomes including score and attempt metrics.
 */
export const results = pgTable("results", {
  sessionId: uuid()
    .primaryKey()
    .references(() => testSessions.id),
  timeTaken: integer().notNull(),
  marksAwarded: integer().notNull(),
  questionsAttempted: integer().notNull(),
});
