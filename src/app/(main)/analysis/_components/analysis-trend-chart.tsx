"use client";

import { Card, CardBody } from "@heroui/react";
import { AnalysisSummary } from "@/lib/zod/analysis";

type Props = {
  scoreTrend: AnalysisSummary["scoreTrend"];
};

const chartWidth = 840;
const chartHeight = 280;
const padding = 24;

const AnalysisTrendChart = ({ scoreTrend }: Props) => {
  if (scoreTrend.length === 0) {
    return null;
  }

  const maxScore = Math.max(...scoreTrend.map((point) => point.scorePct), 100);
  const points = scoreTrend.map((point, index) => {
    const x =
      padding +
      (index / Math.max(1, scoreTrend.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight -
      padding -
      (point.scorePct / Math.max(maxScore, 1)) * (chartHeight - padding * 2);

    return {
      ...point,
      x,
      y,
    };
  });

  return (
    <Card className="bg-slate-900/70 border border-slate-700/70 backdrop-blur-xl" shadow="sm">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Score Trend</h2>
          <p className="text-sm text-slate-400">{scoreTrend.length} attempts tracked</p>
        </div>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[680px]"
            role="img"
            aria-label="Score trend over attempts"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y =
                chartHeight -
                padding -
                (value / Math.max(maxScore, 1)) * (chartHeight - padding * 2);
              return (
                <g key={value}>
                  <line
                    x1={padding}
                    x2={chartWidth - padding}
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.2)"
                    strokeWidth="1"
                  />
                  <text x={4} y={y + 5} fill="rgba(148,163,184,0.8)" fontSize="11">
                    {value}%
                  </text>
                </g>
              );
            })}
            <polyline
              fill="none"
              stroke="rgba(129,140,248,1)"
              strokeWidth="3"
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            />
            {points.map((point) => (
              <g key={point.attemptNumber}>
                <circle cx={point.x} cy={point.y} r="5" fill="rgba(167,139,250,1)" />
                <text
                  x={point.x}
                  y={chartHeight - 4}
                  fill="rgba(148,163,184,0.8)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  A{point.attemptNumber}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
};

export default AnalysisTrendChart;
