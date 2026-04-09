"use client";

import { Card, CardBody } from "@heroui/react";
import { AnalysisSummary } from "@/lib/zod/analysis";

type Props = {
  overview: AnalysisSummary["overview"];
  timeInsights: AnalysisSummary["timeInsights"];
  recommendations: AnalysisSummary["recommendations"];
};

const AnalysisTimePanel = ({ overview, timeInsights, recommendations }: Props) => {
  return (
    <Card className="bg-slate-900/70 border border-slate-700/70 backdrop-blur-xl" shadow="sm">
      <CardBody className="gap-4">
        <h2 className="text-lg font-bold text-slate-100">Time and Efficiency</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Marks / Min</p>
            <p className="text-xl font-bold text-slate-100">{overview.marksPerMinute.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Avg Utilization</p>
            <p className="text-xl font-bold text-slate-100">
              {timeInsights.averageUtilizationPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Fastest Attempt</p>
            <p className="text-xl font-bold text-slate-100">
              {(timeInsights.fastestAttemptSec / 60).toFixed(1)}m
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Slowest Attempt</p>
            <p className="text-xl font-bold text-slate-100">
              {(timeInsights.slowestAttemptSec / 60).toFixed(1)}m
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-indigo-300">Pacing Insight</p>
          <p className="mt-1 text-sm text-indigo-100">{timeInsights.recommendation}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Recommended Next Steps
          </p>
          <ul className="space-y-2">
            {recommendations.slice(0, 4).map((recommendation) => (
              <li
                key={recommendation}
                className="text-sm text-slate-200 rounded-lg border border-slate-700 bg-slate-900/80 p-2"
              >
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};

export default AnalysisTimePanel;
