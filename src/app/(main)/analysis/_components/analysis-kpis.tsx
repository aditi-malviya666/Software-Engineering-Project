"use client";

import { Card, CardBody } from "@heroui/react";
import { TrendUpIcon, TargetIcon, TimerIcon, TrophyIcon } from "@phosphor-icons/react";
import { AnalysisSummary } from "@/lib/zod/analysis";

type Props = {
  overview: AnalysisSummary["overview"];
};

const kpiConfig = [
  {
    label: "Latest Score",
    key: "latestScorePct",
    suffix: "%",
    icon: TrophyIcon,
  },
  {
    label: "Average Accuracy",
    key: "avgAccuracyPct",
    suffix: "%",
    icon: TargetIcon,
  },
  {
    label: "Consistency Index",
    key: "consistencyIndex",
    suffix: "%",
    icon: TrendUpIcon,
  },
  {
    label: "Avg Time / Question",
    key: "avgSecondsPerQuestion",
    suffix: "s",
    icon: TimerIcon,
  },
] as const;

const AnalysisKpis = ({ overview }: Props) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpiConfig.map((item) => {
        const value = overview[item.key];
        const Icon = item.icon;

        return (
          <Card
            key={item.key}
            className="bg-slate-900/70 border border-slate-700/70 backdrop-blur-xl"
            shadow="sm"
          >
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-slate-400">{item.label}</p>
                <Icon className="text-indigo-300" size={18} />
              </div>
              <p className="text-3xl font-bold text-slate-100">
                {value.toFixed(1)}
                <span className="ml-1 text-lg text-slate-400">{item.suffix}</span>
              </p>
            </CardBody>
          </Card>
        );
      })}
    </section>
  );
};

export default AnalysisKpis;
