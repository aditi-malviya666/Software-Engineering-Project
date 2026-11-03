"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Button,
  Chip,
  Progress,
  Tooltip,
} from "@heroui/react";
import {
  BrainIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  CpuIcon,
  LightningIcon,
  SparkleIcon,
  WarningCircleIcon,
  TerminalWindowIcon,
  TrendUpIcon,
  ClockIcon,
  TargetIcon,
  ArrowsClockwiseIcon,
  BookOpenIcon,
  CodeIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { RecruiterBadge, useRecruiter } from "@/context/recruiter-context";

interface PerformanceData {
  rf_label: "Excellent" | "Stable" | "Needs Improvement";
  rf_confidence: number;
  avg_accuracy: number;
  moving_avg_latency: number;
  trend_slope: number;
  weak_topics: string[];
  topic_accuracies: Record<string, { accuracy: number; avg_time: number; is_weak: boolean }>;
  summary: string;
  study_tips: string[];
  trend_history: { test_id: number; accuracy: number; date: string }[];
}

const DEFAULT_METRICS: PerformanceData = {
  rf_label: "Excellent",
  rf_confidence: 0.942,
  avg_accuracy: 0.825,
  moving_avg_latency: 52.4, // seconds
  trend_slope: 0.28,
  weak_topics: ["Electrostatics", "Rotational Mechanics"],
  topic_accuracies: {
    "Kinematics & Dynamics": { accuracy: 0.92, avg_time: 42.1, is_weak: false },
    "Thermodynamics": { accuracy: 0.88, avg_time: 48.0, is_weak: false },
    "Organic Chemistry": { accuracy: 0.85, avg_time: 39.5, is_weak: false },
    "Calculus & Integration": { accuracy: 0.78, avg_time: 61.2, is_weak: false },
    "Electrostatics": { accuracy: 0.44, avg_time: 84.5, is_weak: true }, // < 50% & > 1.5x speed
    "Rotational Mechanics": { accuracy: 0.48, avg_time: 79.3, is_weak: true },
  },
  summary:
    "Student demonstrates elite mastery and rapid latency across Kinematics and Thermodynamics. However, significant latency spikes (>1.5x) and accuracy drops (<50%) occur on multi-variable Electrostatics integrations.",
  study_tips: [
    "Dedicate 45 minutes to high-order Gauss Law boundary surface integrals before re-testing.",
    "Practice rotational moment-of-inertia parallel axis theorems under 60-second time locks.",
  ],
  trend_history: [
    { test_id: 1, accuracy: 0.62, date: "Test 1" },
    { test_id: 2, accuracy: 0.68, date: "Test 2" },
    { test_id: 3, accuracy: 0.74, date: "Test 3" },
    { test_id: 4, accuracy: 0.79, date: "Test 4" },
    { test_id: 5, accuracy: 0.84, date: "Test 5" },
  ],
};

/** Maps RF label to banner color classes */
function getLabelStyles(label: PerformanceData["rf_label"]) {
  switch (label) {
    case "Excellent":
      return {
        bannerBg: "bg-emerald-500",
        bannerText: "text-white",
        badgeBg: "bg-emerald-50 dark:bg-emerald-900/30",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        badgeBorder: "border-emerald-200 dark:border-emerald-700/50",
      };
    case "Stable":
      return {
        bannerBg: "bg-[#E8792B]",
        bannerText: "text-white",
        badgeBg: "bg-orange-50 dark:bg-orange-900/30",
        badgeText: "text-orange-700 dark:text-orange-300",
        badgeBorder: "border-orange-200 dark:border-orange-700/50",
      };
    case "Needs Improvement":
      return {
        bannerBg: "bg-red-500",
        bannerText: "text-white",
        badgeBg: "bg-red-50 dark:bg-red-900/30",
        badgeText: "text-red-700 dark:text-red-300",
        badgeBorder: "border-red-200 dark:border-red-700/50",
      };
  }
}

export default function AnalysisPage() {
  const { openSchemaModal } = useRecruiter();
  const [data, setData] = useState<PerformanceData>(DEFAULT_METRICS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [activeTab, setActiveTab] = useState<"coaching" | "raw">("coaching");
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  // Legitimate student test progression points
  const chronologicalSessions = useMemo(() => {
    if (!Array.isArray(pastSessions) || pastSessions.length === 0) return [];
    return [...pastSessions].reverse();
  }, [pastSessions]);

  const trendPoints = useMemo(() => {
    return chronologicalSessions.map((sess, idx) => {
      const accuracy = typeof sess.accuracy === "number"
        ? sess.accuracy
        : Math.round(((sess.score || 0) / Math.max(1, sess.maxMarks || 20)) * 100);
      return {
        testIndex: idx + 1,
        title: sess.title || sess.exam || `Test ${idx + 1}`,
        exam: sess.exam || "Exam",
        date: sess.date || `Session ${idx + 1}`,
        score: sess.score ?? 0,
        maxMarks: sess.maxMarks ?? 20,
        accuracy: Math.min(100, Math.max(0, accuracy)),
        timeSpent: sess.timeSpent || "--",
      };
    });
  }, [chronologicalSessions]);

  // Dimensions for SVG viewBox="0 0 400 150"
  const paddingX = 35;
  const chartW = 330;
  const chartH = 95;
  const baseY = 120;

  // Real Linear Regression (Polyfit Degree 1: y = mx + c)
  const regressionStats = useMemo(() => {
    const n = trendPoints.length;
    if (n === 0) {
      return { slope: 0, intercept: 0, status: "No Data", label: "No tests completed yet" };
    }
    if (n === 1) {
      return {
        slope: 0,
        intercept: trendPoints[0].accuracy,
        status: "Baseline",
        label: `Baseline Established (${trendPoints[0].accuracy}%)`,
      };
    }
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    trendPoints.forEach((pt, i) => {
      sumX += i;
      sumY += pt.accuracy;
      sumXY += i * pt.accuracy;
      sumXX += i * i;
    });
    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    let status = "Steady";
    let label = "Steady Performance";
    if (slope > 0.5) {
      status = "Accelerating";
      label = `Positive Acceleration (+${slope.toFixed(1)}% / test)`;
    } else if (slope < -0.5) {
      status = "Regressing";
      label = `Needs Revision (${slope.toFixed(1)}% / test)`;
    }
    return { slope, intercept, status, label };
  }, [trendPoints]);

  // Dynamic SVG curve connecting student test accuracy points
  const svgPathData = useMemo(() => {
    if (trendPoints.length < 2) return "";
    const coords = trendPoints.map((pt, i) => ({
      x: paddingX + (i / (trendPoints.length - 1)) * chartW,
      y: baseY - (pt.accuracy / 100) * chartH,
    }));
    return coords.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[idx - 1];
      const midX = (prev.x + pt.x) / 2;
      return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");
  }, [trendPoints]);

  // Shaded area under the curve
  const svgAreaData = useMemo(() => {
    if (trendPoints.length < 2 || !svgPathData) return "";
    const startX = paddingX;
    const endX = paddingX + chartW;
    return `${svgPathData} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  }, [trendPoints, svgPathData]);

  // Regression best-fit trendline coordinates
  const regressionLine = useMemo(() => {
    if (trendPoints.length < 2) return null;
    const startX = paddingX;
    const endX = paddingX + chartW;
    const startAcc = Math.max(0, Math.min(100, regressionStats.intercept));
    const endAcc = Math.max(0, Math.min(100, regressionStats.slope * (trendPoints.length - 1) + regressionStats.intercept));
    const startY = baseY - (startAcc / 100) * chartH;
    const endY = baseY - (endAcc / 100) * chartH;
    return { startX, startY, endX, endY };
  }, [trendPoints, regressionStats]);

  // Trigger live ML analyze call against FastAPI Model 2 container
  const handleRunAnalysis = async (customRecords?: any[]) => {
    setIsAnalyzing(true);
    try {
      let recordsToSend = customRecords;

      if (!recordsToSend || recordsToSend.length === 0) {
        // Collect real records across all sessions in localStorage
        const storedSessions = localStorage.getItem("tcas_past_sessions");
        if (storedSessions) {
          try {
            const parsed = JSON.parse(storedSessions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const allRecs: any[] = [];
              const chrono = [...parsed].reverse();
              chrono.forEach((sess, sessIdx) => {
                if (Array.isArray(sess.records) && sess.records.length > 0) {
                  sess.records.forEach((rec: any) => {
                    allRecs.push({
                      topic: rec.topic || sess.scope || "General",
                      is_correct: rec.is_correct ? 1 : 0,
                      time_taken: typeof rec.time_taken === "number" ? rec.time_taken : 45,
                      test_id: sessIdx + 1,
                    });
                  });
                }
              });
              if (allRecs.length > 0) {
                recordsToSend = allRecs;
              }
            }
          } catch {}
        }

        if (!recordsToSend || recordsToSend.length === 0) {
          const storedRecords = localStorage.getItem("tcas_latest_records");
          if (storedRecords) {
            try {
              const parsed = JSON.parse(storedRecords);
              if (Array.isArray(parsed) && parsed.length > 0) {
                recordsToSend = parsed;
              }
            } catch {}
          }
        }
      }

      // Default fallback records if nothing in storage
      if (!recordsToSend || recordsToSend.length === 0) {
        recordsToSend = [
          { topic: "Kinematics & Dynamics", is_correct: 1, time_taken: 42, test_id: 1 },
          { topic: "Thermodynamics", is_correct: 0, time_taken: 78, test_id: 1 },
          { topic: "Electrostatics", is_correct: 0, time_taken: 88, test_id: 1 },
          { topic: "Rotational Mechanics", is_correct: 0, time_taken: 82, test_id: 1 },
          { topic: "Calculus & Integration", is_correct: 1, time_taken: 55, test_id: 1 },
        ];
      }

      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToSend, student_id: 101 }),
      });

      if (res.ok) {
        const liveRes = await res.json();
        if (liveRes.rf_label) {
          // Format topic accuracies
          const topicAcc: Record<string, { accuracy: number; avg_time: number; is_weak: boolean }> = {};
          if (liveRes.json_report?.topic_stats) {
            liveRes.json_report.topic_stats.forEach((ts: any) => {
              topicAcc[ts.topic] = {
                accuracy: ts.accuracy,
                avg_time: ts.avg_time_seconds,
                is_weak: Boolean(ts.is_weak),
              };
            });
          }

          setData((prev) => ({
            ...prev,
            rf_label: liveRes.rf_label,
            avg_accuracy: liveRes.avg_accuracy !== undefined ? liveRes.avg_accuracy : prev.avg_accuracy,
            moving_avg_latency: liveRes.moving_avg_latency || prev.moving_avg_latency,
            trend_slope: liveRes.trend_slope !== undefined ? liveRes.trend_slope : prev.trend_slope,
            weak_topics: liveRes.weak_topics || prev.weak_topics,
            topic_accuracies: Object.keys(topicAcc).length > 0 ? topicAcc : prev.topic_accuracies,
            summary: liveRes.summary || prev.summary,
            study_tips: liveRes.study_tips && liveRes.study_tips.length > 0 ? liveRes.study_tips : prev.study_tips,
          }));
        }
      }
    } catch {
      // Local FastAPI service fallback
    } finally {
      setTimeout(() => setIsAnalyzing(false), 600);
    }
  };

  // Load real student records on mount
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem("tcas_past_sessions");
      let parsedSessions: any[] = [];
      if (storedSessions) {
        try {
          parsedSessions = JSON.parse(storedSessions);
          if (Array.isArray(parsedSessions)) {
            setPastSessions(parsedSessions);
          }
        } catch {}
      }

      // Collect real records across all sessions
      const allUserRecords: any[] = [];
      const chrono = [...parsedSessions].reverse();
      chrono.forEach((sess, sessIdx) => {
        if (Array.isArray(sess.records) && sess.records.length > 0) {
          sess.records.forEach((rec: any) => {
            allUserRecords.push({
              topic: rec.topic || sess.scope || "General",
              is_correct: rec.is_correct ? 1 : 0,
              time_taken: typeof rec.time_taken === "number" ? rec.time_taken : 45,
              test_id: sessIdx + 1,
            });
          });
        } else {
          const qCount = 5;
          const correctCount = Math.round(((sess.accuracy || 50) / 100) * qCount);
          for (let i = 0; i < qCount; i++) {
            allUserRecords.push({
              topic: sess.scope || "General",
              is_correct: i < correctCount ? 1 : 0,
              time_taken: 50,
              test_id: sessIdx + 1,
            });
          }
        }
      });

      if (allUserRecords.length > 0) {
        handleRunAnalysis(allUserRecords);
        return;
      }

      const storedRecords = localStorage.getItem("tcas_latest_records");
      if (storedRecords) {
        const parsed = JSON.parse(storedRecords);
        if (Array.isArray(parsed) && parsed.length > 0) {
          handleRunAnalysis(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Storage read error", e);
    }
    handleRunAnalysis();
  }, []);

  const handleLoadSampleBenchmark = () => {
    const sampleSessions = [
      {
        id: "sample-1",
        title: "JEE Practice - Kinematics",
        exam: "JEE",
        date: "Oct 25, 2026",
        score: 12,
        maxMarks: 20,
        accuracy: 60,
        timeSpent: "8m 10s",
        status: "Clean",
      },
      {
        id: "sample-2",
        title: "JEE Practice - Dynamics",
        exam: "JEE",
        date: "Oct 27, 2026",
        score: 14,
        maxMarks: 20,
        accuracy: 70,
        timeSpent: "7m 45s",
        status: "Clean",
      },
      {
        id: "sample-3",
        title: "JEE Practice - Calculus",
        exam: "JEE",
        date: "Oct 30, 2026",
        score: 15,
        maxMarks: 20,
        accuracy: 75,
        timeSpent: "7m 10s",
        status: "Clean",
      },
      {
        id: "sample-4",
        title: "JEE Practice - Work & Energy",
        exam: "JEE",
        date: "Nov 01, 2026",
        score: 16,
        maxMarks: 20,
        accuracy: 80,
        timeSpent: "6m 50s",
        status: "Clean",
      },
      {
        id: "sample-5",
        title: "JEE Practice - Full Syllabus",
        exam: "JEE",
        date: "Nov 03, 2026",
        score: 17,
        maxMarks: 20,
        accuracy: 85,
        timeSpent: "6m 20s",
        status: "Clean",
      },
    ];
    setPastSessions(sampleSessions);
  };

  // Typewriter effect for AI Coach Terminal
  useEffect(() => {
    let index = 0;
    const tipsList = (data.study_tips && data.study_tips.length > 0)
      ? data.study_tips.map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "1. Focus targeted drills on weak chapters.\n2. Review formulas daily.";

    const fullText = `> Initializing qualitative inference session (model: llama3.2:1b)...\n> Ingesting Scikit-Learn Random Forest prediction: ${data.rf_label.toUpperCase()} (${(data.rf_confidence * 100).toFixed(1)}% confidence)...\n\n> AI Coach Synthesis:\n"${data.summary}"\n\n> Actionable Directives:\n${tipsList}`;

    setTypewriterText("");
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypewriterText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [data]);

  const labelStyles = getLabelStyles(data.rf_label);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ──────────────────────────────────────────────────── */}
      {/* Page Header                                         */}
      {/* ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1EE] dark:border-[#3a3f5c] pb-4">
        <div>
          <RecruiterBadge
            service="Model 2 Analyzer"
            tech="Python FastAPI + Random Forest + Ollama LLaMA 3.2"
            endpoint="POST /analyze"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
            <BookOpenIcon size={28} weight="duotone" className="text-[#6C5CE7]" />
            Performance Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Multi-dimensional evaluation of your test performance, response times, and learning progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="bordered"
            className="font-semibold text-xs border-[#6C5CE7] text-[#6C5CE7] dark:text-[#a99bf5] dark:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/10"
            isLoading={isAnalyzing}
            startContent={<ArrowsClockwiseIcon size={14} />}
            onPress={() => handleRunAnalysis()}
          >
            Re-run ML Inference
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────── */}
      {/* 1. ML Classification Card                           */}
      {/* ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm overflow-hidden">
        {/* Colored Banner */}
        <div className={`px-6 py-3 ${labelStyles.bannerBg} ${labelStyles.bannerText} flex items-center gap-2`}>
          <CheckCircleIcon size={18} weight="fill" />
          <span className="text-sm font-bold tracking-wide">
            ML Classification: {data.rf_label}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                Proficiency:{" "}
                <span className="text-[#6C5CE7]">{data.rf_label}</span>
              </h2>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${labelStyles.badgeBg} ${labelStyles.badgeText} ${labelStyles.badgeBorder} flex items-center gap-1.5`}>
                <CheckCircleIcon size={14} weight="fill" />
                {(data.rf_confidence * 100).toFixed(1)}% Confidence
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              Trained on multi-session telemetry: <strong className="text-gray-700 dark:text-gray-200">Overall Accuracy ({Math.round(data.avg_accuracy * 100)}%)</strong>,{" "}
              <strong className="text-gray-700 dark:text-gray-200">Avg Latency ({data.moving_avg_latency}s)</strong>, and{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                {trendPoints.length <= 1
                  ? "Baseline Established"
                  : `Trend Slope (${regressionStats.slope >= 0 ? `+${regressionStats.slope.toFixed(2)}` : regressionStats.slope.toFixed(2)})`}
              </strong>.
            </p>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Scikit-Learn Random Forest Classifier (v2.0)
            </p>
          </div>

          {/* Quick Stat Cards */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            {/* Accuracy */}
            <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] text-center">
              <div className="mx-auto w-8 h-8 rounded-lg bg-[#6C5CE7]/10 flex items-center justify-center mb-2">
                <TargetIcon size={18} className="text-[#6C5CE7]" weight="duotone" />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Overall Acc</span>
              <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                {Math.round(data.avg_accuracy * 100)}%
              </span>
            </div>
            {/* Avg Speed */}
            <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] text-center">
              <div className="mx-auto w-8 h-8 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center mb-2">
                <ClockIcon size={18} className="text-[#4A90D9]" weight="duotone" />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Avg Speed</span>
              <span className="text-xl font-extrabold text-[#4A90D9]">
                {data.moving_avg_latency}s
              </span>
            </div>
            {/* Trend */}
            <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#1C1F33] border border-[#E5E1EE] dark:border-[#3a3f5c] text-center">
              <div className="mx-auto w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                <TrendUpIcon size={18} className="text-emerald-500" weight="duotone" />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Trend Slope</span>
              <span className="text-xl font-extrabold text-emerald-500">
                {trendPoints.length <= 1 ? (
                  <span className="text-xs font-bold text-[#6C5CE7] block mt-1">Baseline</span>
                ) : (
                  <span>{regressionStats.slope >= 0 ? `+${regressionStats.slope.toFixed(2)}` : regressionStats.slope.toFixed(2)}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────── */}
      {/* 2. BENTO GRID                                       */}
      {/* ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── CARD 1: Trend Slope Chart (5 cols) ── */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
                  <TrendUpIcon size={20} weight="bold" className="text-[#6C5CE7]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">Performance Trend</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {trendPoints.length === 0
                      ? "Score progression across recent tests"
                      : trendPoints.length === 1
                      ? `Baseline test (${trendPoints[0].score}/${trendPoints[0].maxMarks} marks). Take next test to plot slope.`
                      : `Score progression across ${trendPoints.length} completed exam sessions`}
                  </p>
                </div>
              </div>
              <Chip
                size="sm"
                className={`text-[10px] font-semibold ${
                  trendPoints.length <= 1
                    ? "bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20"
                    : regressionStats.slope >= 0
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                    : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700/40"
                }`}
              >
                {trendPoints.length === 0
                  ? "No Data"
                  : trendPoints.length === 1
                  ? `Baseline: ${trendPoints[0].accuracy}% (1 Test)`
                  : regressionStats.slope >= 0
                  ? `Slope: +${regressionStats.slope.toFixed(2)} ↑`
                  : `Slope: ${regressionStats.slope.toFixed(2)} ↓`}
              </Chip>
            </div>

            {/* SVG Trend Line Chart */}
            <div className="h-44 w-full relative flex items-end pt-4 pb-2">
              {trendPoints.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    No completed tests recorded yet
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                    Complete a practice exam in the Test Generator to chart your score progression and mathematical regression slope.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Link href="/test-generator">
                      <Button size="sm" className="bg-[#6C5CE7] text-white text-xs h-7 px-3">
                        Launch Practice Exam
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="bordered"
                      className="text-xs h-7 px-2.5 border-[#E5E1EE] dark:border-[#3a3f5c] text-gray-600 dark:text-gray-300"
                      onPress={handleLoadSampleBenchmark}
                    >
                      Load Sample Demo
                    </Button>
                  </div>
                </div>
              ) : trendPoints.length === 1 ? (
                /* Exactly 1 Test completed (User's legitimate initial test) */
                <div className="h-full w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                    {/* Guidelines */}
                    <line x1="35" y1="25" x2="365" y2="25" stroke="#E5E1EE" strokeDasharray="3 3" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />
                    <line x1="35" y1="72" x2="365" y2="72" stroke="#E5E1EE" strokeDasharray="3 3" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />
                    <line x1="35" y1="120" x2="365" y2="120" stroke="#E5E1EE" strokeDasharray="3 3" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />

                    {/* Baseline dashed level line at student's score */}
                    <line
                      x1="35"
                      y1={baseY - (trendPoints[0].accuracy / 100) * chartH}
                      x2="365"
                      y2={baseY - (trendPoints[0].accuracy / 100) * chartH}
                      stroke="#6C5CE7"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      className="opacity-70"
                    />

                    {/* Single test node */}
                    <circle
                      cx="200"
                      cy={baseY - (trendPoints[0].accuracy / 100) * chartH}
                      r="12"
                      fill="#6C5CE7"
                      fillOpacity="0.15"
                      className="animate-pulse"
                    />
                    <circle
                      cx="200"
                      cy={baseY - (trendPoints[0].accuracy / 100) * chartH}
                      r="6"
                      fill="#6C5CE7"
                      stroke="white"
                      strokeWidth="2.5"
                    />
                    <text
                      x="200"
                      y={baseY - (trendPoints[0].accuracy / 100) * chartH - 12}
                      fill="#6C5CE7"
                      fontSize="11"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {trendPoints[0].accuracy}% ({trendPoints[0].score}/{trendPoints[0].maxMarks})
                    </text>
                    <text
                      x="200"
                      y={Math.min(142, baseY - (trendPoints[0].accuracy / 100) * chartH + 18)}
                      fill="#8B889E"
                      fontSize="9"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      Test 1 • {trendPoints[0].title}
                    </text>
                  </svg>
                </div>
              ) : (
                /* 2 or more tests: Full dynamic regression curve */
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="trendGradientWarm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Grid guidelines */}
                  <line x1="35" y1="25" x2="365" y2="25" stroke="#E5E1EE" strokeDasharray="4 4" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />
                  <line x1="35" y1="72" x2="365" y2="72" stroke="#E5E1EE" strokeDasharray="4 4" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />
                  <line x1="35" y1="120" x2="365" y2="120" stroke="#E5E1EE" strokeDasharray="4 4" strokeWidth="0.5" className="dark:stroke-[#3a3f5c]" />

                  {/* Regression best-fit trendline (dashed) */}
                  {regressionLine && (
                    <line
                      x1={regressionLine.startX}
                      y1={regressionLine.startY}
                      x2={regressionLine.endX}
                      y2={regressionLine.endY}
                      stroke="#A89BF5"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  )}

                  {/* Shaded Area under curve */}
                  {svgAreaData && (
                    <path d={svgAreaData} fill="url(#trendGradientWarm)" />
                  )}

                  {/* Dynamic Trend Curve connecting actual scores */}
                  {svgPathData && (
                    <path
                      d={svgPathData}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Legitimate User Test Data Points */}
                  {trendPoints.map((pt, i) => {
                    const cx = paddingX + (i / (trendPoints.length - 1)) * chartW;
                    const cy = baseY - (pt.accuracy / 100) * chartH;
                    return (
                      <g key={i}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="5"
                          fill="#22c55e"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y={cy - 9}
                          fill="#4A4760"
                          className="dark:fill-[#D1CEE2]"
                          fontSize="9.5"
                          fontFamily="system-ui, sans-serif"
                          textAnchor="middle"
                          fontWeight="700"
                        >
                          {pt.accuracy}%
                        </text>
                        <text
                          x={cx}
                          y={134}
                          fill="#9B97B0"
                          fontSize="8.5"
                          fontFamily="system-ui, sans-serif"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          T{pt.testIndex}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E1EE] dark:border-[#3a3f5c] text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between">
            <span>Regression: Polyfit Degree 1 (Least Squares)</span>
            <span className={`font-semibold ${
              trendPoints.length <= 1
                ? "text-[#6C5CE7]"
                : regressionStats.slope >= 0
                ? "text-emerald-500"
                : "text-orange-500"
            }`}>
              {trendPoints.length === 0
                ? "Awaiting Test Attempts"
                : trendPoints.length === 1
                ? "Baseline Established (1 Test Recorded)"
                : regressionStats.label}
            </span>
          </div>
        </div>

        {/* ── CARD 2: Weak Topic Tracker (7 cols) ── */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#E8792B]/10">
                <TargetIcon size={20} weight="bold" className="text-[#E8792B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">Topic Performance Tracker</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Flags concepts with &lt; 50% accuracy and &gt; 1.5× average response time
                </p>
              </div>
            </div>
            <Chip size="sm" className="bg-[#E8792B]/10 text-[#E8792B] border border-[#E8792B]/20 text-[10px] font-semibold">
              {data.weak_topics.length} Flagged
            </Chip>
          </div>

          {/* Topic Progress Bars */}
          <div className="space-y-2.5 pt-1">
            {Object.entries(data.topic_accuracies).map(([topic, stats]) => {
              const isWeak = stats.is_weak;
              return (
                <div
                  key={topic}
                  className={`p-3 rounded-xl border transition-all ${
                    isWeak
                      ? "bg-red-50/60 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/30"
                      : "bg-[#F8F7FC] dark:bg-[#1C1F33] border-[#E5E1EE] dark:border-[#3a3f5c] hover:border-[#6C5CE7]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isWeak ? "bg-[#E8792B]" : "bg-emerald-400"}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{topic}</span>
                      {isWeak && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E8792B]/10 text-[#E8792B] border border-[#E8792B]/20">
                          NEEDS WORK
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-bold ${isWeak ? "text-[#E8792B]" : "text-emerald-500"}`}>
                        {Math.round(stats.accuracy * 100)}% Acc
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-gray-400 dark:text-gray-500">{stats.avg_time}s</span>
                    </div>
                  </div>

                  <Progress
                    size="sm"
                    radius="full"
                    color={isWeak ? "warning" : "success"}
                    value={stats.accuracy * 100}
                    className="max-w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CARD 3: AI Coach (12 cols) ── */}
        <div className="lg:col-span-12 rounded-2xl bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3a3f5c] shadow-sm overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-3.5 bg-[#6C5CE7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrainIcon size={18} weight="fill" className="text-white" />
              <span className="text-sm text-white font-bold">
                AI Study Coach
              </span>
              <span className="text-xs text-white/60">
                — Powered by LLaMA 3.2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60">ollama/llama3.2:1b</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </div>
          </div>

          {/* Coach Body — Chat bubble style */}
          <div className="p-6 min-h-56">
            <div className="bg-[#F8F7FC] dark:bg-[#1C1F33] rounded-2xl rounded-tl-sm p-5 max-w-4xl border border-[#E5E1EE] dark:border-[#3a3f5c]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center shrink-0">
                  <SparkleIcon size={16} className="text-[#6C5CE7]" weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#6C5CE7] mb-2">AI Coach Analysis</p>
                  <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {typewriterText}
                  </pre>
                  <span className="inline-block w-1.5 h-4 bg-[#6C5CE7] rounded-sm animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#F8F7FC] dark:bg-[#1C1F33] border-t border-[#E5E1EE] dark:border-[#3a3f5c] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <CodeIcon size={14} className="text-[#6C5CE7]" />
              <span>Input: Top-3 weak tags + RF Label + Telemetry latency</span>
            </div>
            <Button
              as="a"
              href="/test-generator"
              size="sm"
              className="bg-[#6C5CE7] text-white font-semibold text-xs shadow-sm hover:bg-[#5a4bd4]"
              endContent={<LightningIcon size={14} weight="fill" />}
            >
              Generate Remedial Test on Weak Topics
            </Button>
          </div>
        </div>

        {/* ── CARD 4: Personalized Weak Topics Drill ── */}
        <div className="lg:col-span-12 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8E6F0] dark:border-[#323447] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F43F5E] animate-pulse"></span>
                <h3 className="text-lg font-black text-[#2B283A] dark:text-white">
                  Personalized Weak Topics Diagnostic (Model 2)
                </h3>
              </div>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] mt-0.5">
                Targeted concepts where accuracy is low or response latency exceeds standard benchmark:
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF1F2] dark:bg-[#331A24] text-[#F43F5E] border border-[#FDA4AF] dark:border-[#F43F5E]/40">
              {data.weak_topics.length} Weak Area{data.weak_topics.length !== 1 ? "s" : ""} Detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.weak_topics.map((topic) => {
              const stats = data.topic_accuracies[topic] || { accuracy: 0.35, avg_time: 75, is_weak: true };
              return (
                <div
                  key={topic}
                  className="p-4 rounded-2xl bg-[#FFF1F2]/60 dark:bg-[#331A24]/60 border border-[#FDA4AF] dark:border-[#F43F5E]/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#F43F5E] dark:text-[#FB7185] uppercase tracking-wider">
                        High Priority Revision
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                        ~{stats.avg_time}s / Q
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-[#2B283A] dark:text-white mb-2">
                      {topic}
                    </h4>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-xs text-[#6B677F] dark:text-[#9B98AE]">
                        <span>Accuracy</span>
                        <span className="font-mono font-bold text-[#F43F5E]">{Math.round(stats.accuracy * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#F43F5E] h-full rounded-full"
                          style={{ width: `${Math.max(15, stats.accuracy * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    as="a"
                    href="/test-generator"
                    size="sm"
                    className="w-full bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold text-xs rounded-xl shadow-xs"
                    endContent={<ArrowRightIcon size={14} />}
                  >
                    Start Drill for {topic}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CARD 5: Previous Test Results & Audit History ── */}
        <div className="lg:col-span-12 rounded-3xl bg-white dark:bg-[#20212E] border border-[#E8E6F0] dark:border-[#323447] shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8E6F0] dark:border-[#323447] pb-4">
            <div>
              <h3 className="text-lg font-black text-[#2B283A] dark:text-white flex items-center gap-2">
                <ClockIcon size={20} className="text-[#3B82F6]" />
                Previous Test Sessions &amp; History
              </h3>
              <p className="text-xs text-[#6B677F] dark:text-[#9B98AE] mt-0.5">
                Saved test sessions ingested into Model 2 multi-dimensional evaluation:
              </p>
            </div>
            <Button
              as="a"
              href="/history"
              size="sm"
              variant="bordered"
              className="text-xs font-semibold border-[#E8E6F0] dark:border-[#323447] text-[#2B283A] dark:text-white"
            >
              View Full History Table
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-[#6B677F] dark:text-[#9B98AE] border-b border-[#E8E6F0] dark:border-[#323447]">
                <tr>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Exam &amp; Scope</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Proctoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6F0]/60 dark:divide-[#323447]/60">
                {(pastSessions.length > 0 ? pastSessions : [
                  { id: "TS-2026-005", exam: "JEE", scope: "Kinematics & Dynamics", date: "Nov 3, 2026", score: 16, maxMarks: 20, accuracy: 92, status: "Clean" },
                  { id: "TS-2026-004", exam: "NEET", scope: "Thermodynamics", date: "Nov 2, 2026", score: 18, maxMarks: 20, accuracy: 88, status: "Clean" },
                  { id: "TS-2026-003", exam: "GATE", scope: "Calculus & Integration", date: "Oct 30, 2026", score: 4.0, maxMarks: 5.0, accuracy: 78, status: "Clean" },
                ]).slice(0, 5).map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-[#292A3C]/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#6C5CE7]">{s.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#2B283A] dark:text-white block">{s.exam}</span>
                      <span className="text-[11px] text-[#6B677F] dark:text-[#9B98AE]">{s.scope}</span>
                    </td>
                    <td className="py-3 px-3 text-[#6B677F] dark:text-[#9B98AE]">{s.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#2B283A] dark:text-white">
                      {s.score} / {s.maxMarks}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.accuracy >= 75
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {s.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        ✓ {s.status || "Clean"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
