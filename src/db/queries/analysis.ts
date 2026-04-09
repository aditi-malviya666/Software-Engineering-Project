import { db } from "@/db/schema";
import { questionPapers } from "@/db/schema/questionPapers";
import { questions } from "@/db/schema/questions";
import { responses } from "@/db/schema/responses";
import { results } from "@/db/schema/results";
import { tags } from "@/db/schema/tags";
import { tagsQuestions } from "@/db/schema/tagsQuestion";
import { testSessions } from "@/db/schema/testSession";
import { AnalysisSummary } from "@/lib/zod/analysis";
import { asc, eq, inArray, sql } from "drizzle-orm";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toPercentage = (num: number, den: number) =>
  den <= 0 ? 0 : clamp((num / den) * 100, 0, 100);

const calculateStdDev = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const getAnalysisSummary = async (
  userId: string,
): Promise<AnalysisSummary> => {
  const sessionRows = await db
    .select({
      sessionId: testSessions.id,
      qpId: testSessions.qpId,
      attemptedAt: testSessions.attemptedAt,
      marksAwarded: results.marksAwarded,
      questionsAttempted: results.questionsAttempted,
      timeTaken: results.timeTaken,
      paperName: questionPapers.name,
      timeLimitMinutes: questionPapers.timeLimit,
    })
    .from(testSessions)
    .innerJoin(results, eq(results.sessionId, testSessions.id))
    .leftJoin(questionPapers, eq(questionPapers.id, testSessions.qpId))
    .where(eq(testSessions.userId, userId))
    .orderBy(asc(testSessions.attemptedAt));

  if (sessionRows.length === 0) {
    return {
      hasData: false,
      generatedAt: new Date().toISOString(),
      overview: {
        totalAttempts: 0,
        avgScorePct: 0,
        latestScorePct: 0,
        bestScorePct: 0,
        consistencyIndex: 0,
        avgAccuracyPct: 0,
        avgSecondsPerQuestion: 0,
        marksPerMinute: 0,
        improvementDeltaPct: 0,
      },
      scoreTrend: [],
      topicPerformance: [],
      timeInsights: {
        averageTimePerQuestionSec: 0,
        averageUtilizationPct: 0,
        fastestAttemptSec: 0,
        slowestAttemptSec: 0,
        recommendation: "Complete your first test to unlock tailored insights.",
      },
      recommendations: [
        "Attempt at least 3 tests to generate reliable trend analysis.",
      ],
    };
  }

  const qpIds = Array.from(
    new Set(
      sessionRows
        .map((row) => row.qpId)
        .filter((qpId): qpId is string => qpId !== null),
    ),
  );

  const maxMarksByQp = new Map<string, number>();
  if (qpIds.length > 0) {
    const maxMarkRows = await db
      .select({
        qpId: questions.qpId,
        maxMarks: sql<number>`coalesce(sum(${questions.marksCorrect}), 0)`,
      })
      .from(questions)
      .where(inArray(questions.qpId, qpIds))
      .groupBy(questions.qpId);

    for (const row of maxMarkRows) {
      if (row.qpId) {
        maxMarksByQp.set(row.qpId, Number(row.maxMarks));
      }
    }
  }

  const responseRows = await db
    .select({
      sessionId: responses.sessionId,
      marked: responses.marked,
      responseValue: responses.responseValue,
      timeTaken: responses.timeTaken,
    })
    .from(responses)
    .innerJoin(testSessions, eq(testSessions.id, responses.sessionId))
    .where(eq(testSessions.userId, userId));

  const sessionAccuracyMap = new Map<
    string,
    { attempted: number; correct: number; answeredTimeTotal: number }
  >();

  for (const response of responseRows) {
    const sessionId = response.sessionId ?? "unknown";
    const existing = sessionAccuracyMap.get(sessionId) ?? {
      attempted: 0,
      correct: 0,
      answeredTimeTotal: 0,
    };
    const attempted = response.responseValue !== null;
    if (attempted) {
      existing.attempted += 1;
      existing.answeredTimeTotal += response.timeTaken ?? 0;
      if (response.marked) existing.correct += 1;
    }
    sessionAccuracyMap.set(sessionId, existing);
  }

  const topicRows = await db
    .select({
      tagName: tags.name,
      tagLabel: tags.label,
      marked: responses.marked,
      responseValue: responses.responseValue,
      timeTaken: responses.timeTaken,
    })
    .from(responses)
    .innerJoin(testSessions, eq(testSessions.id, responses.sessionId))
    .leftJoin(tagsQuestions, eq(tagsQuestions.questionId, responses.questionId))
    .leftJoin(tags, eq(tags.id, tagsQuestions.tagId))
    .where(eq(testSessions.userId, userId));

  const trend = sessionRows.map((row, index) => {
    const maxMarks = row.qpId
      ? maxMarksByQp.get(row.qpId) ?? row.questionsAttempted * 4
      : row.questionsAttempted * 4;
    const scorePct = toPercentage(row.marksAwarded, Math.max(maxMarks, 1));

    return {
      attemptNumber: index + 1,
      attemptedAt: row.attemptedAt.toISOString(),
      marks: row.marksAwarded,
      maxMarks,
      scorePct: Number(scorePct.toFixed(2)),
      timeTakenSeconds: row.timeTaken,
    };
  });

  const scorePercentages = trend.map((point) => point.scorePct);
  const latestScorePct = scorePercentages[scorePercentages.length - 1] ?? 0;
  const bestScorePct = scorePercentages.length > 0 ? Math.max(...scorePercentages) : 0;
  const avgScorePct =
    scorePercentages.reduce((sum, value) => sum + value, 0) /
    Math.max(scorePercentages.length, 1);
  const consistencyIndex = clamp(100 - calculateStdDev(scorePercentages) * 2, 0, 100);
  const improvementDeltaPct = latestScorePct - (scorePercentages[0] ?? 0);

  const totalMarks = sessionRows.reduce((sum, row) => sum + row.marksAwarded, 0);
  const totalMinutes =
    sessionRows.reduce((sum, row) => sum + row.timeTaken, 0) / Math.max(60, 1);
  const marksPerMinute = totalMinutes > 0 ? totalMarks / totalMinutes : 0;

  const totalAttemptedQuestions = sessionRows.reduce(
    (sum, row) => sum + row.questionsAttempted,
    0,
  );
  const totalTimeSeconds = sessionRows.reduce((sum, row) => sum + row.timeTaken, 0);
  const avgSecondsPerQuestion =
    totalAttemptedQuestions > 0 ? totalTimeSeconds / totalAttemptedQuestions : 0;

  const perSessionAccuracies = sessionRows.map((row) => {
    const metrics = sessionAccuracyMap.get(row.sessionId);
    if (!metrics) return 0;
    return toPercentage(metrics.correct, Math.max(metrics.attempted, 1));
  });
  const avgAccuracyPct =
    perSessionAccuracies.reduce((sum, value) => sum + value, 0) /
    Math.max(perSessionAccuracies.length, 1);

  const utilizationValues = sessionRows
    .filter((row) => typeof row.timeLimitMinutes === "number" && row.timeLimitMinutes > 0)
    .map((row) => {
      const timeLimitMinutes = row.timeLimitMinutes ?? 0;
      return toPercentage(row.timeTaken, timeLimitMinutes * 60);
    });

  const averageUtilizationPct =
    utilizationValues.reduce((sum, value) => sum + value, 0) /
    Math.max(utilizationValues.length, 1);

  const topicMap = new Map<
    string,
    {
      tagName: string;
      tagLabel: string;
      attempts: number;
      correct: number;
      timeTotal: number;
    }
  >();

  for (const row of topicRows) {
    const key = row.tagName ?? "unclassified";
    const label = row.tagLabel ?? "Unclassified";
    const existing = topicMap.get(key) ?? {
      tagName: key,
      tagLabel: label,
      attempts: 0,
      correct: 0,
      timeTotal: 0,
    };

    const attempted = row.responseValue !== null;
    if (attempted) {
      existing.attempts += 1;
      existing.timeTotal += row.timeTaken ?? 0;
      if (row.marked) existing.correct += 1;
    }
    topicMap.set(key, existing);
  }

  const topicPerformance = Array.from(topicMap.values())
    .filter((topic) => topic.attempts > 0)
    .map((topic) => {
      const accuracyPct = toPercentage(topic.correct, topic.attempts);
      const avgTopicTime = topic.timeTotal / Math.max(topic.attempts, 1);
      const strength: "weak" | "moderate" | "strong" =
        accuracyPct < 50 ? "weak" : accuracyPct < 75 ? "moderate" : "strong";

      return {
        tagName: topic.tagName,
        tagLabel: topic.tagLabel,
        attempts: topic.attempts,
        correct: topic.correct,
        accuracyPct: Number(accuracyPct.toFixed(2)),
        avgSecondsPerQuestion: Number(avgTopicTime.toFixed(2)),
        strength,
      };
    })
    .sort((a, b) => a.accuracyPct - b.accuracyPct || b.attempts - a.attempts)
    .slice(0, 12);

  const weakestTopic = topicPerformance.find((topic) => topic.strength === "weak");
  const strongestTopic = [...topicPerformance]
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .find(() => true);

  const recommendations: string[] = [];
  if (weakestTopic) {
    recommendations.push(
      `Prioritize ${weakestTopic.tagLabel}: current accuracy is ${weakestTopic.accuracyPct.toFixed(1)}%.`,
    );
  }
  if (improvementDeltaPct < 0) {
    recommendations.push(
      "Your recent score dropped vs the first attempt. Revisit mistake patterns before increasing difficulty.",
    );
  } else if (improvementDeltaPct > 0) {
    recommendations.push(
      `Great momentum: your score trend improved by ${improvementDeltaPct.toFixed(1)} percentage points.`,
    );
  }
  if (avgSecondsPerQuestion > 110) {
    recommendations.push(
      "Time per question is high. Practice timed mini-sets to improve decision speed.",
    );
  } else {
    recommendations.push(
      "Time control is healthy. Focus next on accuracy gains in weak areas.",
    );
  }
  if (strongestTopic) {
    recommendations.push(
      `Leverage strength in ${strongestTopic.tagLabel} to build confidence before hard mixed sets.`,
    );
  }

  const slowestAttemptSec = Math.max(...sessionRows.map((row) => row.timeTaken));
  const fastestAttemptSec = Math.min(...sessionRows.map((row) => row.timeTaken));
  const timeRecommendation =
    averageUtilizationPct > 95
      ? "You are near full time utilization; train pacing to finish with a short review buffer."
      : averageUtilizationPct < 60
        ? "You finish early on average; use spare time to re-check tricky questions."
        : "Pacing is balanced. Keep a 5-10 minute review window for final checks.";

  return {
    hasData: true,
    generatedAt: new Date().toISOString(),
    overview: {
      totalAttempts: sessionRows.length,
      avgScorePct: Number(avgScorePct.toFixed(2)),
      latestScorePct: Number(latestScorePct.toFixed(2)),
      bestScorePct: Number(bestScorePct.toFixed(2)),
      consistencyIndex: Number(consistencyIndex.toFixed(2)),
      avgAccuracyPct: Number(avgAccuracyPct.toFixed(2)),
      avgSecondsPerQuestion: Number(avgSecondsPerQuestion.toFixed(2)),
      marksPerMinute: Number(marksPerMinute.toFixed(2)),
      improvementDeltaPct: Number(improvementDeltaPct.toFixed(2)),
    },
    scoreTrend: trend,
    topicPerformance,
    timeInsights: {
      averageTimePerQuestionSec: Number(avgSecondsPerQuestion.toFixed(2)),
      averageUtilizationPct: Number(averageUtilizationPct.toFixed(2)),
      fastestAttemptSec,
      slowestAttemptSec,
      recommendation: timeRecommendation,
    },
    recommendations,
  };
};
