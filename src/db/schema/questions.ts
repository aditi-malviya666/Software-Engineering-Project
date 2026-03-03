import { integer, json, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { questionPapers } from "./questionPapers";
import { InferSelectModel } from "drizzle-orm";
import {
  QuestionAnswerJsonType,
  QuestionArgumentsJsonType,
} from "@/lib/zod/questions";

export const questions = pgTable("questions", {
  id: uuid().primaryKey().defaultRandom(),
  qpId: uuid().references(() => questionPapers.id, { onDelete: "cascade" }),
  questionText: text().notNull(),
  questionType: integer().notNull(),
  order: integer().notNull(),
  questionArguments: json().$type<QuestionArgumentsJsonType>(),
  answer: json().$type<QuestionAnswerJsonType>(),
  marksCorrect: integer().notNull(),
  marksIncorrect: integer().notNull(),
  solution: text(),
});

export type Question = InferSelectModel<typeof questions>;
