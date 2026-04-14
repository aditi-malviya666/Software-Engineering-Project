"use client";

import { useState } from "react";

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

const LABEL_META: Record<string, { color: string; bg: string; rgb: string }> = {
  "Needs Improvement": {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    rgb: "239,68,68",
  },
  Stable: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    rgb: "245,158,11",
  },
  Excellent: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    rgb: "34,197,94",
  },
};

const topicMeta = (acc: number) => {
  if (acc >= 0.7)
    return {
      text: "STRONG",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.15)",
      rgb: "34,197,94",
    };

  if (acc >= 0.5)
    return {
      text: "OK",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
      rgb: "245,158,11",
    };

  return {
    text: "WEAK",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    rgb: "239,68,68",
  };
};

export default function AnalysisPage() {
  const [studentId, setStudentId] = useState(42);
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
     THIS IS THE CONNECTION TO MODEL 2
     It now fetches results from PostgreSQL via API
  */

  const analyse = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        /*
          IMPORTANT FIX:
          Send ONLY studentId
          Backend will fetch results from DB
        */

        body: JSON.stringify({
          student_id: studentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(
        "Could not reach API. Check if backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const pg: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #050d1a 0%, #0d1b2a 60%, #0a1225 100%)",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "36px 16px",
  };

  const wrap: React.CSSProperties = {
    maxWidth: 860,
    margin: "0 auto",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  };

  return (
    <div style={pg}>
      <div style={wrap}>

        {/* Header */}

        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginBottom: 8,
              background:
                "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Model 2 · Performance Analyser
          </h1>

          <p
            style={{
              color: "#475569",
              fontSize: 13,
            }}
          >
            Data fetched automatically from Model 1 results
          </p>
        </div>

        {/* Student Input */}

        <div style={card}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 18,
            }}
          >
            Student Data
          </div>

          <input
            type="number"
            value={studentId}
            onChange={(e) =>
              setStudentId(Number(e.target.value))
            }
            style={{
              width: 120,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
            }}
          />

          <button
            onClick={analyse}
            disabled={loading}
            style={{
              marginTop: 18,
              width: "100%",
              background: loading
                ? "#1e293b"
                : "linear-gradient(135deg, #2563eb, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading
              ? "⏳ Analysing…"
              : "🔍 Analyse Performance"}
          </button>
        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              background:
                "rgba(239,68,68,0.08)",
              border:
                "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#fca5a5",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Results */}

        {result && (() => {
          const lm =
            LABEL_META[result.rf_label] ??
            LABEL_META["Stable"];

          return (
            <div style={card}>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: `rgb(${lm.rgb})`,
                  marginBottom: 12,
                }}
              >
                {result.rf_label}
              </div>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#cbd5e1",
                }}
              >
                {result.summary}
              </p>

            </div>
          );
        })()}

      </div>
    </div>
  );
}