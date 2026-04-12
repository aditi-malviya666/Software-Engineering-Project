"use client";

import { useState } from "react";

interface TestAttempt {
  test_session_id: number;
  is_correct: 0 | 1;
  time_taken_seconds: number;
  topic_tag: string;
}

interface AnalyseResponse {
  student_id: number;
  session_count: number;
  rf_label: "Needs Improvement" | "Stable" | "Excellent";
  avg_accuracy: number;
  moving_avg_latency: number;
  trend_slope: number;
  weak_topics: string[];
  topic_accuracies: Record<string, number>;
  summary: string;
  study_tips: string[];
  model_used: string;
}

const TOPICS = ["Calculus", "Optics", "Thermodynamics", "Mechanics", "Algebra", "Chemistry", "Biology"];

const LABEL_META: Record<string, { color: string; bg: string; rgb: string }> = {
  "Needs Improvement": { color: "#ef4444", bg: "rgba(239,68,68,0.12)", rgb: "239,68,68" },
  Stable:              { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", rgb: "245,158,11" },
  Excellent:           { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  rgb: "34,197,94"  },
};

const topicMeta = (acc: number) => {
  if (acc >= 0.7) return { text: "STRONG", color: "#22c55e", bg: "rgba(34,197,94,0.15)",  rgb: "34,197,94"  };
  if (acc >= 0.5) return { text: "OK",     color: "#f59e0b", bg: "rgba(245,158,11,0.15)", rgb: "245,158,11" };
  return              { text: "WEAK",   color: "#ef4444", bg: "rgba(239,68,68,0.15)",  rgb: "239,68,68"  };
};

const emptyAttempt = (): TestAttempt => ({ test_session_id: 1, is_correct: 1, time_taken_seconds: 45, topic_tag: "Calculus" });

export default function AnalysisPage() {
  const [studentId, setStudentId] = useState(42);
  const [attempts, setAttempts] = useState<TestAttempt[]>([
    { test_session_id: 1, is_correct: 0, time_taken_seconds: 72, topic_tag: "Optics" },
    { test_session_id: 1, is_correct: 1, time_taken_seconds: 55, topic_tag: "Calculus" },
    { test_session_id: 2, is_correct: 0, time_taken_seconds: 80, topic_tag: "Optics" },
    { test_session_id: 2, is_correct: 1, time_taken_seconds: 44, topic_tag: "Thermodynamics" },
    { test_session_id: 3, is_correct: 1, time_taken_seconds: 40, topic_tag: "Calculus" },
    { test_session_id: 3, is_correct: 0, time_taken_seconds: 65, topic_tag: "Optics" },
  ]);
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAttempt = () => setAttempts(p => [...p, emptyAttempt()]);
  const removeAttempt = (i: number) => setAttempts(p => p.filter((_, idx) => idx !== i));
  const updateAttempt = (i: number, key: keyof TestAttempt, val: string | number) =>
    setAttempts(p => { const n = [...p]; n[i] = { ...n[i], [key]: val } as TestAttempt; return n; });

  const analyse = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, attempts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : data.detail?.[0]?.msg ?? "Unknown error");
      } else { setResult(data); }
    } catch { setError("Could not reach the API. Is FastAPI running on port 8000?"); }
    finally { setLoading(false); }
  };

  const pg: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #050d1a 0%, #0d1b2a 60%, #0a1225 100%)",
    color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "36px 16px",
  };
  const wrap: React.CSSProperties = { maxWidth: 860, margin: "0 auto" };
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 24, marginBottom: 24,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#475569",
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 18,
  };
  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, outline: "none",
  };
  const sel: React.CSSProperties = {
    width: "100%", background: "#0f1d2e", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, outline: "none",
  };

  return (
    <div style={pg}>
      <div style={wrap}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h1 style={{
            fontSize: 30, fontWeight: 800, marginBottom: 8,
            background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>TCAS Model 2 · Performance Analyser</h1>
          <p style={{ color: "#475569", fontSize: 13 }}>Random Forest + Ollama AI Coach · Three-Test Rule enforced</p>
        </div>

        {/* ── Input card ── */}
        <div style={card}>
          <div style={sectionTitle}>Student Data</div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Student ID</label>
            <input style={{ ...inp, width: 100 }} type="number" value={studentId}
              onChange={e => setStudentId(Number(e.target.value))} />
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "58px 1fr 130px 100px 36px", gap: 8, marginBottom: 6 }}>
            {["Session", "Topic", "Result", "Time (s)", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</span>
            ))}
          </div>

          {attempts.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "58px 1fr 130px 100px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input style={inp} type="number" min={1} value={a.test_session_id}
                onChange={e => updateAttempt(i, "test_session_id", Number(e.target.value))} />
              <select style={sel} value={a.topic_tag} onChange={e => updateAttempt(i, "topic_tag", e.target.value)}>
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
              <select style={sel} value={a.is_correct} onChange={e => updateAttempt(i, "is_correct", Number(e.target.value) as 0|1)}>
                <option value={1}>✅ Correct</option>
                <option value={0}>❌ Wrong</option>
              </select>
              <input style={inp} type="number" min={1} value={a.time_taken_seconds}
                onChange={e => updateAttempt(i, "time_taken_seconds", Number(e.target.value))} />
              <button onClick={() => removeAttempt(i)} style={{
                background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: 13,
              }}>✕</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={addAttempt} style={{
              background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13,
            }}>+ Add Row</button>
          </div>

          <button onClick={analyse} disabled={loading} style={{
            marginTop: 14, width: "100%",
            background: loading ? "#1e293b" : "linear-gradient(135deg, #2563eb, #6366f1)",
            color: loading ? "#475569" : "#fff",
            border: "none", borderRadius: 10, padding: "13px 0",
            fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
          }}>
            {loading ? "⏳ Analysing…" : "🔍 Analyse Performance"}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10, padding: "14px 18px", color: "#fca5a5", fontSize: 14, marginBottom: 20,
          }}>⚠️ {error}</div>
        )}

        {/* ── Results ── */}
        {result && (() => {
          const lm = LABEL_META[result.rf_label] ?? LABEL_META["Stable"];
          return (
            <>
              {/* Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Label",    value: result.rf_label,                              rgb: lm.rgb },
                  { label: "Accuracy", value: `${(result.avg_accuracy * 100).toFixed(1)}%`, rgb: "96,165,250" },
                  { label: "Sessions", value: String(result.session_count),                 rgb: "167,139,250" },
                  { label: "Avg Time", value: `${result.moving_avg_latency.toFixed(0)}s`,   rgb: "251,191,36" },
                ].map(({ label, value, rgb }) => (
                  <div key={label} style={{
                    background: `rgba(${rgb},0.07)`, border: `1px solid rgba(${rgb},0.18)`,
                    borderRadius: 12, padding: "18px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: `rgb(${rgb})`, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Topics */}
              <div style={card}>
                <div style={sectionTitle}>Topic Breakdown</div>
                {Object.entries(result.topic_accuracies ?? {}).map(([topic, acc]) => {
                  const tm = topicMeta(acc);
                  return (
                    <div key={topic} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 14, color: "#cbd5e1" }}>
                          {topic}
                          <span style={{
                            marginLeft: 8, padding: "2px 9px", borderRadius: 20,
                            fontSize: 10, fontWeight: 800, color: tm.color, background: tm.bg,
                          }}>{tm.text}</span>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: `rgb(${tm.rgb})` }}>
                          {(acc * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${acc * 100}%`,
                          background: `rgb(${tm.rgb})`, borderRadius: 4,
                        }} />
                      </div>
                    </div>
                  );
                })}
                {result.weak_topics.length > 0 && (
                  <div style={{
                    marginTop: 14, padding: "11px 15px",
                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: 9, fontSize: 13, color: "#fca5a5",
                  }}>🎯 Focus areas: {result.weak_topics.join(", ")}</div>
                )}
              </div>

              {/* AI Coach */}
              <div style={card}>
                <div style={sectionTitle}>🤖 AI Coach</div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#cbd5e1", marginBottom: 22 }}>{result.summary}</p>
                {result.study_tips.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "#334155", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Study Tips</div>
                    {result.study_tips.map((tip: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{
                          minWidth: 22, height: 22, borderRadius: "50%",
                          background: "rgba(99,102,241,0.18)", color: "#a5b4fc",
                          fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65 }}>{tip}</span>
                      </div>
                    ))}
                  </>
                )}
                <div style={{ marginTop: 16, fontSize: 11, color: "#1e293b" }}>model: {result.model_used}</div>
              </div>
            </>
          );
        })()}

      </div>
    </div>
  );
}