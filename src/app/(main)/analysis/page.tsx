"use client";

import { Button, Spinner } from "@heroui/react";
import React, { useCallback, useEffect, useState } from "react";
import AnalysisKpis from "./_components/analysis-kpis";
import AnalysisTimePanel from "./_components/analysis-time-panel";
import AnalysisTopicBreakdown from "./_components/analysis-topic-breakdown";
import AnalysisTrendChart from "./_components/analysis-trend-chart";
import { AnalysisSummary, analysisSummarySchema } from "@/lib/zod/analysis";

const initialSummary: AnalysisSummary = {
  hasData: false,
  generatedAt: new Date(0).toISOString(),
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
    recommendation: "Complete your first test to unlock analysis.",
  },
  recommendations: [],
};

const AnalysisPage = () => {
  const [summary, setSummary] = useState<AnalysisSummary>(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analysis/summary");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load analysis data.");
      }

      const parsed = analysisSummarySchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("Received malformed analysis payload from server.");
      }
      setSummary(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner color="secondary" label="Loading analysis..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-2xl border border-slate-700/70 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-5">
        <h1 className="font-bold text-3xl text-slate-50">Analysis</h1>
        <p className="text-sm text-slate-300 mt-1">
          Track score trends, topic weaknesses, and time efficiency with actionable insights.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-600/50 bg-rose-900/20 p-4">
          <p className="text-sm text-rose-200">{error}</p>
          <Button color="danger" variant="flat" className="mt-3" onPress={loadSummary}>
            Retry
          </Button>
        </div>
      ) : null}

      {!summary.hasData ? (
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-slate-100">No analytics yet</h2>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl">
            Generate and complete at least one test. This dashboard will then automatically show
            score momentum, weak topics, and time efficiency patterns.
          </p>
        </div>
      ) : (
        <>
          <AnalysisKpis overview={summary.overview} />
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <AnalysisTrendChart scoreTrend={summary.scoreTrend} />
            </div>
            <div>
              <AnalysisTopicBreakdown topicPerformance={summary.topicPerformance} />
            </div>
          </section>
          <AnalysisTimePanel
            overview={summary.overview}
            timeInsights={summary.timeInsights}
            recommendations={summary.recommendations}
          />
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
