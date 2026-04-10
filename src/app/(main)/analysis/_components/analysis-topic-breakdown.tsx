"use client";

import { Card, CardBody } from "@heroui/react";
import { AnalysisSummary } from "@/lib/zod/analysis";

type Props = {
  topicPerformance: AnalysisSummary["topicPerformance"];
};

const getPillStyles = (strength: "weak" | "moderate" | "strong") => {
  if (strength === "weak") return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  if (strength === "moderate")
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
};

const AnalysisTopicBreakdown = ({ topicPerformance }: Props) => {
  const weakest = topicPerformance.slice(0, 5);

  return (
    <Card className="bg-slate-900/70 border border-slate-700/70 backdrop-blur-xl" shadow="sm">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Topic Weakness Map</h2>
          <p className="text-sm text-slate-400">Sorted by lowest accuracy</p>
        </div>
        <div className="space-y-3">
          {weakest.map((topic) => (
            <div
              key={topic.tagName}
              className="p-3 rounded-xl border border-slate-700 bg-slate-900/80"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{topic.tagLabel}</p>
                  <p className="text-xs text-slate-400">
                    {topic.correct}/{topic.attempts} correct
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wide ${getPillStyles(topic.strength)}`}
                >
                  {topic.strength}
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-indigo-400 to-violet-400"
                    style={{ width: `${topic.accuracyPct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>{topic.accuracyPct.toFixed(1)}% accuracy</span>
                  <span>{topic.avgSecondsPerQuestion.toFixed(0)}s / question</span>
                </div>
              </div>
            </div>
          ))}
          {weakest.length === 0 && (
            <p className="text-sm text-slate-400">
              Topic analysis appears after tagged attempts are available.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default AnalysisTopicBreakdown;
