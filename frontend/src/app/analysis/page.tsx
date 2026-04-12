"use client";

import { useState } from "react";
import { useAnalyse } from "@/lib/useAnalyse";
import type { TestAttempt } from "@/lib/types";

const TOPICS = [
  "Optics", "Thermodynamics", "Calculus", "Mechanics",
  "Electromagnetism", "Algebra", "Trigonometry", "Modern Physics",
];

const DEFAULT_ATTEMPTS: TestAttempt[] = [
  { test_session_id: 1, is_correct: 0, time_taken_seconds: 72, topic_tag: "Optics" },
  { test_session_id: 1, is_correct: 1, time_taken_seconds: 55, topic_tag: "Calculus" },
  { test_session_id: 2, is_correct: 0, time_taken_seconds: 80, topic_tag: "Optics" },
  { test_session_id: 2, is_correct: 1, time_taken_seconds: 44, topic_tag: "Thermodynamics" },
  { test_session_id: 3, is_correct: 1, time_taken_seconds: 40, topic_tag: "Calculus" },
  { test_session_id: 3, is_correct: 0, time_taken_seconds: 65, topic_tag: "Optics" },
];

const LABEL_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "Excellent":         { bg: "#052e16", text: "#4ade80", border: "#166534", icon: "↑" },
  "Stable":            { bg: "#1c1400", text: "#fbbf24", border: "#854d0e", icon: "→" },
  "Needs Improvement": { bg: "#2d0a0a", text: "#f87171", border: "#991b1b", icon: "↓" },
};

function barColor(acc: number): string {
  if (acc >= 0.70) return "#22c55e";
  if (acc >= 0.50) return "#eab308";
  return "#ef4444";
}

function AttemptRow({ index, attempt, onChange, onRemove }: {
  index: number;
  attempt: TestAttempt;
  onChange: (i: number, a: TestAttempt) => void;
  onRemove: (i: number) => void;
}) {
  const inp: React.CSSProperties = {
    border: "1px solid #1e3a5f",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    background: "#0d1f33",
    color: "#cbd5e1",
    outline: "none",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 24px", gap: 8, alignItems: "center" }}>
      <input type="number" min={1} value={attempt.test_session_id}
        onChange={(e) => onChange(index, { ...attempt, test_session_id: Number(e.target.value) })}
        style={inp} />
      <select value={attempt.topic_tag}
        onChange={(e) => onChange(index, { ...attempt, topic_tag: e.target.value })}
        style={inp}>
        {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={attempt.is_correct}
        onChange={(e) => onChange(index, { ...attempt, is_correct: Number(e.target.value) as 0 | 1 })}
        style={inp}>
        <option value={1}>Correct</option>
        <option value={0}>Incorrect</option>
      </select>
      <input type="number" min={1} value={attempt.time_taken_seconds}
        onChange={(e) => onChange(index, { ...attempt, time_taken_seconds: Number(e.target.value) })}
        style={inp} />
      <button onClick={() => onRemove(index)}
        style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", padding: 0 }}>
        ×
      </button>
    </div>
  );
}

export default function AnalysisPage() {
  const { analyse, data, loading, error, reset } = useAnalyse();
  const [studentId, setStudentId] = useState<number>(1);
  const [attempts, setAttempts]   = useState<TestAttempt[]>(DEFAULT_ATTEMPTS);

  const sessionCount   = new Set(attempts.map((a) => a.test_session_id)).size;
  const sessionsNeeded = Math.max(0, 3 - sessionCount);
  const ls             = data ? LABEL_STYLE[data.rf_label] : null;

  const addAttempt    = () => setAttempts((p) => [...p, { test_session_id: 1, is_correct: 1, time_taken_seconds: 45, topic_tag: "Calculus" }]);
  const updateAttempt = (i: number, a: TestAttempt) => setAttempts((p) => p.map((x, idx) => idx === i ? a : x));
  const removeAttempt = (i: number) => setAttempts((p) => p.filter((_, idx) => idx !== i));

  const card: React.CSSProperties = {
    background: "#0d1f33",
    border: "1px solid #1e3a5f",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#334155",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    margin: "0 0 14px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060e1a", padding: "36px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            🎯
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>TCAS Model 2</h1>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Performance Analysis — Random Forest + AI Coaching</p>
          </div>
        </div>

        {/* Input card */}
        <div style={card}>
          {/* Student ID */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <label style={{ fontSize: 13, color: "#64748b", minWidth: "max-content" }}>Student ID</label>
            <input type="number" min={1} value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              style={{ border: "1px solid #1e3a5f", borderRadius: 8, padding: "7px 12px", fontSize: 14, width: 88, background: "#060e1a", color: "#f1f5f9", outline: "none" }} />
            <div style={{ marginLeft: "auto", fontSize: 13 }}>
              <span style={{ color: sessionCount >= 3 ? "#4ade80" : "#64748b", fontWeight: 600 }}>
                {sessionCount} session{sessionCount !== 1 ? "s" : ""}
              </span>
              {sessionsNeeded > 0 && (
                <span style={{ color: "#f87171", marginLeft: 8, fontSize: 12 }}>({sessionsNeeded} more needed)</span>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 24px", gap: 8, marginBottom: 8 }}>
            {["Session", "Topic", "Result", "Time (s)", ""].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#1e3a5f", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {attempts.map((a, i) => (
              <AttemptRow key={i} index={i} attempt={a} onChange={updateAttempt} onRemove={removeAttempt} />
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addAttempt}
              style={{ fontSize: 13, border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 16px", background: "transparent", color: "#475569", cursor: "pointer" }}>
              + Add attempt
            </button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              {data && (
                <button onClick={reset}
                  style={{ fontSize: 13, border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 16px", background: "transparent", color: "#475569", cursor: "pointer" }}>
                  Reset
                </button>
              )}
              <button
                onClick={() => analyse({ student_id: studentId, attempts })}
                disabled={loading || sessionsNeeded > 0}
                style={{ fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, padding: "8px 28px", background: sessionsNeeded > 0 ? "#0d1f33" : "linear-gradient(135deg,#6366f1,#a855f7)", color: sessionsNeeded > 0 ? "#334155" : "#fff", cursor: sessionsNeeded > 0 ? "not-allowed" : "pointer" }}>
                {loading ? "Analysing…" : "Analyse"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#2d0a0a", border: "1px solid #991b1b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {data && ls && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Performance",  value: `${ls.icon} ${data.rf_label}`, isLabel: true },
                { label: "Accuracy",     value: `${Math.round(data.avg_accuracy * 100)}%` },
                { label: "Sessions",     value: `${data.session_count}` },
                { label: "Avg latency",  value: `${Math.round(data.moving_avg_latency)}s` },
              ].map(({ label, value, isLabel }) => (
                <div key={label} style={{ background: "#0d1f33", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "#334155", margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</p>
                  {isLabel ? (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: ls.bg, color: ls.text, border: `1px solid ${ls.border}` }}>
                      {value}
                    </span>
                  ) : (
                    <p style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Topic breakdown */}
            <div style={{ background: "#0d1f33", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20 }}>
              <p style={sectionLabel}>Topic breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(data.topic_accuracies ?? {})
                  .sort((a, b) => a[1] - b[1])
                  .map(([topic, acc]) => {
                    const isWeak = data.weak_topics.includes(topic);
                    const pct    = Math.round((acc as number) * 100);
                    const color  = barColor(acc as number);
                    return (
                      <div key={topic}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1" }}>{topic}</span>
                            {isWeak && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "#2d0a0a", color: "#f87171", border: "1px solid #991b1b" }}>
                                WEAK
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "#0a1628", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* AI coach */}
            <div style={{ background: "#0d1f33", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20 }}>
              <p style={sectionLabel}>AI coach summary</p>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: "0 0 18px" }}>{data.summary}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.study_tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, background: "#0a1628", border: "1px solid #1e3266", borderRadius: 10, padding: "12px 14px" }}>
                    <span style={{ color: "#818cf8", fontWeight: 700, fontSize: 11, minWidth: "max-content", marginTop: 2 }}>TIP {i + 1}</span>
                    <p style={{ fontSize: 13, color: "#a5b4fc", margin: 0, lineHeight: 1.65 }}>{tip}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#1e3a5f", margin: "14px 0 0" }}>Powered by {data.model_used}</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}