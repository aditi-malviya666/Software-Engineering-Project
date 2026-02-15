import {
  boolean,
  integer,
  json,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { testSessions } from "./testSession";
import { questions } from "./questions";
import { InferSelectModel } from "drizzle-orm";
import { ResponseValueJsonType } from "@/lib/zod/responses";

/**
 * Response table stores user answers for each question in a test session.
 */
export const responses = pgTable("responses", {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid().references(() => testSessions.id, { onDelete: "cascade" }),
  questionId: uuid().references(() => questions.id, { onDelete: "cascade" }),
  responseValue: json().$type<ResponseValueJsonType>(),
  responseType: integer().notNull(),
  attemptedAt: timestamp().notNull(),
  marked: boolean().notNull().default(false),
  timeTaken: integer(),
});

export type Response = InferSelectModel<typeof responses>;
