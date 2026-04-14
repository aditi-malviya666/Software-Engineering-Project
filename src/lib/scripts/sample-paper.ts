// Run this script with 'pnpm tsx ./src/lib/scripts/sample-paper'

import { users } from "@/db/schema/auth-schema";
import { questionPapers } from "@/db/schema/questionPapers";
import { questions } from "@/db/schema/questions";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { QuestionType } from "../enums/question-type";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tags } from "@/db/schema/tags";
import { tagsQp } from "@/db/schema/tagsQp";
import { tagsQuestions } from "@/db/schema/tagsQuestion";

const db = drizzle(
  postgres({
    max: 1,
    ssl: false,
    host: "localhost",
    database: process.env.POSTGRES_DB!,
    port: +process.env.POSTGRES_PORT!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
  }),
);

const createSamplePaper = async () => {
  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.name, "Demo"));

  const sampleQuestionPaperInserted: typeof questionPapers.$inferInsert = {
    name: "Sample Paper",
    timeLimit: 60,
    createdAt: new Date(Date.now()),
    userId: demoUser.id,
    subject: "Mathematics",
    difficulty: "Medium",
    generationType: "manual",
  };

  const [sampleQuestionPaper] = await db
    .insert(questionPapers)
    .values(sampleQuestionPaperInserted)
    .returning();

  const sampleQuestionsInserted: (typeof questions.$inferInsert)[] = [
    {
      questionType: QuestionType.SingleCorrectOption,
      questionText: "Select the odd number",
      questionArguments: {
        options: ["1", "2", "4", "8"],
      },
      answer: {
        correctOption: [0],
      },
      solution: "2, 4 and 8 are divisible by 2",
      order: 0,
    },
    {
      questionType: QuestionType.SingleCorrectOption,
      questionText: "Select the even number",
      questionArguments: {
        options: ["1", "4", "9", "16"],
      },
      answer: {
        correctOptions: [[0]],
      },
      solution: "4 and 16 are divisble by 2",
      order: 1,
    },
    {
      questionType: QuestionType.SingleCorrectOption,
      questionText:
        "What is the natural number whose square is equal to twice its value?",
      questionArguments: {
        precision: 0,
      },
      answer: {
        correctNumber: [0],
      },
      solution: "2 x 2 = 2 + 2 = 4",
      order: 2,
    },
  ].map((e) => ({
    ...e,
    marksCorrect: 5,
    marksIncorrect: -1,
    qpId: sampleQuestionPaper.id,
  }));

  const sampleQuestions = await db
    .insert(questions)
    .values(sampleQuestionsInserted)
    .returning();

  const tagListInserted: (typeof tags.$inferInsert)[] = [
    {
      label: "JEE",
      name: "jee",
    },
    {
      label: "GATE",
      name: "gate",
    },
    {
      label: "CUET",
      name: "cuet",
    },
    {
      label: "Easy",
      name: "easy",
    },
    {
      label: "Medium",
      name: "medium",
    },
    {
      label: "Hard",
      name: "hard",
    },
    { label: "Maths", name: "maths" },
    { label: "Physics", name: "physics" },
    { label: "Chemistry", name: "chemistry" },
  ];

  const tagList = await db.insert(tags).values(tagListInserted).returning();

  const tagQpInserted: typeof tagsQp.$inferInsert = {
    tagId: tagList.find((e) => e.name === "cuet")?.id,
    qpId: sampleQuestionPaper.id,
  };
  await db.insert(tagsQp).values(tagQpInserted);

  const tagQuestionsInserted: (typeof tagsQuestions.$inferInsert)[] = [
    {
      tagId: tagList.find((e) => e.name === "easy")?.id,
      questionId: sampleQuestions[0].id,
    },
    {
      tagId: tagList.find((e) => e.name === "medium")?.id,
      questionId: sampleQuestions[1].id,
    },
    {
      tagId: tagList.find((e) => e.name === "hard")?.id,
      questionId: sampleQuestions[2].id,
    },
    {
      tagId: tagList.find((e) => e.name === "maths")?.id,
      questionId: sampleQuestions[0].id,
    },
    {
      tagId: tagList.find((e) => e.name === "maths")?.id,
      questionId: sampleQuestions[1].id,
    },
    {
      tagId: tagList.find((e) => e.name === "maths")?.id,
      questionId: sampleQuestions[2].id,
    },
  ];
  await db.insert(tagsQuestions).values(tagQuestionsInserted);

  console.log("Done");
};

createSamplePaper();
