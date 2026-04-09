import z, {
  array,
  boolean,
  int,
  number,
  object,
  string,
  union,
} from "zod";

export const attemptQuestionSchema = object({
  questionText: string().min(1),
  options: array(string()).min(2),
  correctAnswer: string().min(1),
  selectedAnswer: union([string(), z.null()]),
  timeTakenSeconds: int().nonnegative().optional(),
});

export const submitAttemptSchema = object({
  examName: string().min(1),
  generationType: string().min(1),
  subject: string().min(1),
  difficulty: string().min(1),
  timeTakenSeconds: int().nonnegative(),
  scoring: object({
    correctMark: number().positive(),
    incorrectMark: number().nonnegative(),
  }),
  questions: array(attemptQuestionSchema).min(1),
});

export const scoreTrendPointSchema = object({
  attemptNumber: int().positive(),
  attemptedAt: string(),
  marks: number(),
  maxMarks: number().nonnegative(),
  scorePct: number().min(0).max(100),
  timeTakenSeconds: int().nonnegative(),
});

export const topicPerformanceSchema = object({
  tagName: string(),
  tagLabel: string(),
  attempts: int().nonnegative(),
  correct: int().nonnegative(),
  accuracyPct: number().min(0).max(100),
  avgSecondsPerQuestion: number().nonnegative(),
  strength: union([
    z.literal("weak"),
    z.literal("moderate"),
    z.literal("strong"),
  ]),
});

export const analysisSummarySchema = object({
  hasData: boolean(),
  generatedAt: string(),
  overview: object({
    totalAttempts: int().nonnegative(),
    avgScorePct: number().min(0).max(100),
    latestScorePct: number().min(0).max(100),
    bestScorePct: number().min(0).max(100),
    consistencyIndex: number().min(0).max(100),
    avgAccuracyPct: number().min(0).max(100),
    avgSecondsPerQuestion: number().nonnegative(),
    marksPerMinute: number().nonnegative(),
    improvementDeltaPct: number(),
  }),
  scoreTrend: array(scoreTrendPointSchema),
  topicPerformance: array(topicPerformanceSchema),
  timeInsights: object({
    averageTimePerQuestionSec: number().nonnegative(),
    averageUtilizationPct: number().min(0),
    fastestAttemptSec: int().nonnegative(),
    slowestAttemptSec: int().nonnegative(),
    recommendation: string(),
  }),
  recommendations: array(string()),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;
