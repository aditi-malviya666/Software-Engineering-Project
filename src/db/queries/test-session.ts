import { db } from "@/db/schema";
import { questionPapers } from "@/db/schema/questionPapers";
import { questions } from "@/db/schema/questions";
import { responses } from "@/db/schema/responses";
import { results } from "@/db/schema/results";
import { tags } from "@/db/schema/tags";
import { tagsQp } from "@/db/schema/tagsQp";
import { tagsQuestions } from "@/db/schema/tagsQuestion";
import { testSessions } from "@/db/schema/testSession";
import { QuestionType } from "@/lib/enums/question-type";
import { SubmitAttemptInput } from "@/lib/zod/analysis";
import { eq } from "drizzle-orm";

const normalizeTagName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

const upsertTag = async (name: string, label: string) => {
  const safeName = normalizeTagName(name);
  if (!safeName) return null;

  await db
    .insert(tags)
    .values({
      name: safeName,
      label: label.trim().slice(0, 80) || safeName,
    })
    .onConflictDoNothing();

  const [existingTag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, safeName));

  return existingTag?.id ?? null;
};

export const persistGeneratedAttempt = async (
  userId: string,
  payload: SubmitAttemptInput,
) => {
  const now = new Date();
  const validQuestions = payload.questions.filter(
    (question) => question.options.length >= 2,
  );

  if (validQuestions.length === 0) {
    throw new Error("No valid questions to persist.");
  }

  const marksCorrect = Math.max(1, Math.round(payload.scoring.correctMark));
  const marksIncorrect = Math.max(0, Math.round(payload.scoring.incorrectMark));

  const questionPaperName = `${payload.examName} ${payload.generationType} Attempt`;
  const [insertedQuestionPaper] = await db
    .insert(questionPapers)
    .values({
      name: questionPaperName,
      createdAt: now,
      userId,
      timeLimit: Math.max(1, Math.ceil(payload.timeTakenSeconds / 60)),
    })
    .returning({ id: questionPapers.id });

  const examTagId = await upsertTag(payload.examName, payload.examName);
  const subjectTagId = await upsertTag(payload.subject, payload.subject);
  const difficultyTagId = await upsertTag(payload.difficulty, payload.difficulty);
  const generationTypeTagId = await upsertTag(
    payload.generationType,
    payload.generationType,
  );

  const uniqueTagIds = Array.from(
    new Set([examTagId, subjectTagId, difficultyTagId, generationTypeTagId]),
  ).filter((tagId): tagId is string => Boolean(tagId));

  if (uniqueTagIds.length > 0) {
    const qpTagRows = uniqueTagIds.map((tagId) => ({
      tagId,
      qpId: insertedQuestionPaper.id,
    }));
    await db.insert(tagsQp).values(qpTagRows);
  }

  const insertedQuestions = await db
    .insert(questions)
    .values(
      validQuestions.map((question, index) => {
        const correctedIndex = Math.max(
          0,
          question.options.indexOf(question.correctAnswer),
        );

        return {
          qpId: insertedQuestionPaper.id,
          questionText: question.questionText,
          questionType: QuestionType.SingleCorrectOption,
          order: index,
          questionArguments: {
            options: question.options,
          },
          answer: {
            correctOption: [correctedIndex],
          },
          marksCorrect,
          marksIncorrect,
          solution: "Generated question",
        };
      }),
    )
    .returning({ id: questions.id, answer: questions.answer });

  if (uniqueTagIds.length > 0) {
    const perQuestionTags = insertedQuestions.flatMap((question) =>
      uniqueTagIds.map((tagId) => ({
        tagId,
        questionId: question.id,
      })),
    );

    await db.insert(tagsQuestions).values(perQuestionTags);
  }

  const [insertedSession] = await db
    .insert(testSessions)
    .values({
      qpId: insertedQuestionPaper.id,
      userId,
      attemptedAt: now,
      submittedAt: now,
    })
    .returning({ id: testSessions.id });

  let marksAwarded = 0;
  let questionsAttempted = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  const responseRows = insertedQuestions.map((persistedQuestion, index) => {
    const selectedAnswer = validQuestions[index]?.selectedAnswer;
    const options = validQuestions[index]?.options ?? [];
    const correctIndex = (
      (persistedQuestion.answer as { correctOption?: number[] } | null)
        ?.correctOption ?? [0]
    )[0];
    const selectedIndex =
      selectedAnswer && options.includes(selectedAnswer)
        ? options.indexOf(selectedAnswer)
        : -1;
    const marked = selectedIndex !== -1 && selectedIndex === correctIndex;

    if (selectedIndex === -1) {
      unattempted += 1;
    } else {
      questionsAttempted += 1;
      if (marked) {
        correct += 1;
        marksAwarded += marksCorrect;
      } else {
        incorrect += 1;
        marksAwarded -= marksIncorrect;
      }
    }

    return {
      sessionId: insertedSession.id,
      questionId: persistedQuestion.id,
      responseValue:
        selectedIndex === -1
          ? null
          : {
              selectedOption: selectedIndex,
            },
      responseType: QuestionType.SingleCorrectOption,
      attemptedAt: now,
      marked,
      timeTaken: validQuestions[index]?.timeTakenSeconds ?? null,
    };
  });

  await db.insert(responses).values(responseRows);

  await db.insert(results).values({
    sessionId: insertedSession.id,
    marksAwarded: Math.round(marksAwarded),
    questionsAttempted,
    timeTaken: payload.timeTakenSeconds,
  });

  return {
    sessionId: insertedSession.id,
    marksAwarded,
    correct,
    incorrect,
    unattempted,
    questionsAttempted,
    totalQuestions: validQuestions.length,
  };
};
