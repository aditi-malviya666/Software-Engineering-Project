"""
=============================================================================
 Model 2 — Student Performance Analysis Module (MERGED v2.0)
 Project: Test Conduction and Assessment System (TCAS)
=============================================================================
 Merged by: Vishal (stats engine) + Keshav (RF model + Ollama coaching)

 Input schema (list of dicts / JSON array):
 {
     "topic":      str,   # Subject area / topic name
     "is_correct": 0|1,   # Whether the student answered correctly
     "time_taken": int,   # Seconds spent on the question
     "test_id":    int    # Identifier of the CBT session
 }

 Public API:
     analyzer = PerformanceAnalyzer(records)
     json_report  = analyzer.get_json_report()
     text_summary = analyzer.get_text_summary()
=============================================================================
"""

from __future__ import annotations

import json
import os
import pickle
import statistics
from dataclasses import dataclass, field, asdict
from typing import Any

# ---------------------------------------------------------------------------
# Optional dependency: pandas
# ---------------------------------------------------------------------------
try:
    import pandas as pd
    _PANDAS_AVAILABLE = True
except ImportError:
    _PANDAS_AVAILABLE = False

# ---------------------------------------------------------------------------
# Optional dependency: numpy (for RF features)
# ---------------------------------------------------------------------------
try:
    import numpy as np
    _NUMPY_AVAILABLE = True
except ImportError:
    _NUMPY_AVAILABLE = False

# ---------------------------------------------------------------------------
# Constants / thresholds
# ---------------------------------------------------------------------------
WEAK_TOPIC_ACCURACY_THRESHOLD = 0.50
SLOW_RESPONSE_MULTIPLIER      = 1.5

# ---------------------------------------------------------------------------
# RF Model loading
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_RF_MODEL_PATH = os.path.join(_HERE, "model2_rf.pkl")

def _load_rf():
    if not os.path.exists(_RF_MODEL_PATH):
        print(f"[WARN] model2_rf.pkl not found at {_RF_MODEL_PATH}")
        return None
    try:
        with open(_RF_MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print(f"[INFO] RF model loaded from {_RF_MODEL_PATH}")
        return model
    except Exception as e:
        print(f"[WARN] Could not load RF model: {e}")
        return None

_RF_MODEL = _load_rf()

# ============================================================================
# Data-class models
# ============================================================================

@dataclass
class TopicStats:
    topic:             str
    total_questions:   int
    correct:           int
    incorrect:         int
    accuracy:          float
    avg_time_seconds:  float
    is_weak:           bool

@dataclass
class TrendPoint:
    test_id:           int
    accuracy:          float
    avg_time_seconds:  float
    questions_count:   int

@dataclass
class PerformanceReport:
    overall_accuracy:    float
    total_questions:     int
    total_tests:         int
    topic_stats:         list[TopicStats]
    weak_topics:         list[str]
    performance_trend:   list[TrendPoint]
    improvement_tips:    list[str]
    trend_direction:     str
    # ── Keshav's RF fields ──
    predicted_label:     str        # "Needs Improvement" | "Stable" | "Excellent"
    rf_confidence:       float      # 0.0–1.0, or -1.0 if unavailable
    summary:             str        # Ollama coaching summary
    study_tips:          list[str]  # Ollama study tips
    model_used:          str        # "llama3.2:1b" or "fallback"

# ============================================================================
# RF Feature Engineering
# ============================================================================

def _engineer_rf_features(records: list[dict]):
    """
    Build the 3 features the RF model was trained on:
      avg_accuracy, moving_avg_latency, trend_slope
    """
    if not _NUMPY_AVAILABLE or not _PANDAS_AVAILABLE:
        return None

    df = pd.DataFrame(records)

    avg_accuracy = float(df["is_correct"].mean())

    moving_avg_latency = float(
        df.sort_values("test_id")["time_taken"]
        .ewm(span=5)
        .mean()
        .iloc[-1]
    )

    session_acc = (
        df.groupby("test_id")["is_correct"]
        .mean()
        .sort_index()
        .values
    )
    if len(session_acc) >= 2:
        x = np.arange(len(session_acc), dtype=float)
        trend_slope = float(np.polyfit(x, session_acc, 1)[0])
    else:
        trend_slope = 0.0

    feature_row = pd.DataFrame(
        [[avg_accuracy, moving_avg_latency, trend_slope]],
        columns=["avg_accuracy", "moving_avg_latency", "trend_slope"],
    )
    return feature_row


def _rf_predict(records: list[dict]) -> tuple[str, float]:
    """Run RF model. Returns (label, confidence)."""
    if _RF_MODEL is None:
        return "N/A", -1.0

    features = _engineer_rf_features(records)
    if features is None:
        return "N/A", -1.0

    try:
        label      = str(_RF_MODEL.predict(features)[0])
        proba      = _RF_MODEL.predict_proba(features)[0]
        confidence = float(np.max(proba))
        return label, round(confidence, 4)
    except Exception as e:
        print(f"[WARN] RF prediction failed: {e}")
        avg_acc = float(sum(r["is_correct"] for r in records) / len(records))
        if avg_acc >= 0.75:
            return "Excellent", -1.0
        elif avg_acc >= 0.50:
            return "Stable", -1.0
        else:
            return "Needs Improvement", -1.0


def _get_ollama_coaching(
    rf_label: str,
    weak_topics: list[str],
    avg_accuracy: float,
    student_id: int = 0,
) -> tuple[str, list[str], str]:
    """Get Ollama coaching. Falls back gracefully if Ollama not running."""
    try:
        from qualitative_engine import QualitativeInput, generate_qualitative_analysis

        qi = QualitativeInput(
            rf_label=rf_label,
            weak_topics=weak_topics if weak_topics else ["General"],
            student_id=student_id,
            avg_accuracy=avg_accuracy,
        )
        qual = generate_qualitative_analysis(qi)
        return qual.summary, qual.study_tips, qual.model_used

    except Exception as exc:
        print(f"[WARN] Ollama unavailable: {exc}")
        summary = (
            f"The student is classified as '{rf_label}' with "
            f"{round(avg_accuracy * 100)}% accuracy. "
            f"Focus areas: {', '.join(weak_topics)}."
        )
        study_tips = [
            f"Review {weak_topics[0]} using spaced repetition and worked examples.",
            f"Practice {weak_topics[1] if len(weak_topics) > 1 else weak_topics[0]} "
            f"with timed past-paper questions daily.",
        ]
        return summary, study_tips, "fallback"


# ============================================================================
# Core Analyser
# ============================================================================

class PerformanceAnalyzer:
    """
    Analyses a student's CBT results.
    Combines Vishal's statistical engine + Keshav's RF + Ollama coaching.
    """

    def __init__(self, records: list[dict[str, Any]], student_id: int = 0) -> None:
        self._raw        = records
        self._student_id = student_id
        self._report: PerformanceReport | None = None

    def get_json_report(self, indent: int = 2) -> str:
        report = self._build_report()
        return json.dumps(asdict(report), indent=indent, ensure_ascii=False)

    def get_text_summary(self) -> str:
        report = self._build_report()
        return self._render_text(report)

    def _build_report(self) -> PerformanceReport:
        if self._report is not None:
            return self._report

        records = self._validate_and_clean(self._raw)

        if not records:
            self._report = PerformanceReport(
                overall_accuracy=0.0,
                total_questions=0,
                total_tests=0,
                topic_stats=[],
                weak_topics=[],
                performance_trend=[],
                improvement_tips=["No valid data provided."],
                trend_direction="insufficient_data",
                predicted_label="N/A",
                rf_confidence=-1.0,
                summary="No data available for analysis.",
                study_tips=[],
                model_used="none",
            )
            return self._report

        # ── Vishal's stats engine ──────────────────────────────────────────
        if _PANDAS_AVAILABLE:
            topic_stats, overall_acc, global_avg_time = self._compute_topic_stats_pandas(records)
            trend = self._compute_trend_pandas(records)
        else:
            topic_stats, overall_acc, global_avg_time = self._compute_topic_stats_stdlib(records)
            trend = self._compute_trend_stdlib(records)

        weak_topics     = [t.topic for t in topic_stats if t.is_weak]
        trend_direction = self._detect_trend_direction(trend)
        tips            = self._generate_tips(topic_stats, trend_direction, global_avg_time)
        total_tests     = len({r["test_id"] for r in records})

        # ── Keshav's RF prediction ─────────────────────────────────────────
        predicted_label, rf_confidence = _rf_predict(records)

        # ── Keshav's Ollama coaching ───────────────────────────────────────
        summary, study_tips, model_used = _get_ollama_coaching(
            predicted_label, weak_topics, overall_acc, self._student_id
        )

        # Add RF tip at the top
        if rf_confidence >= 0:
            tips.insert(0,
                f"ML Prediction: '{predicted_label}' "
                f"(confidence: {rf_confidence*100:.1f}%)"
            )

        self._report = PerformanceReport(
            overall_accuracy=round(overall_acc, 4),
            total_questions=len(records),
            total_tests=total_tests,
            topic_stats=topic_stats,
            weak_topics=weak_topics,
            performance_trend=trend,
            improvement_tips=tips,
            trend_direction=trend_direction,
            predicted_label=predicted_label,
            rf_confidence=rf_confidence,
            summary=summary,
            study_tips=study_tips,
            model_used=model_used,
        )
        return self._report

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_and_clean(records: list[dict]) -> list[dict]:
        required_keys = {"topic", "is_correct", "time_taken", "test_id"}
        cleaned = []
        for i, rec in enumerate(records):
            if not isinstance(rec, dict):
                continue
            if not required_keys.issubset(rec.keys()):
                continue
            try:
                cleaned.append({
                    "topic":      str(rec["topic"]).strip() or "Unknown",
                    "is_correct": int(rec["is_correct"]),
                    "time_taken": max(0, float(rec["time_taken"])),
                    "test_id":    int(rec["test_id"]),
                })
            except (ValueError, TypeError):
                continue
        return cleaned

    # ------------------------------------------------------------------
    # Topic stats — pandas
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_topic_stats_pandas(records):
        df          = pd.DataFrame(records)
        overall_acc = df["is_correct"].mean()
        global_avg  = df["time_taken"].mean()

        agg = df.groupby("topic", sort=False).agg(
            total    =("is_correct", "count"),
            correct  =("is_correct", "sum"),
            avg_time =("time_taken", "mean"),
        ).reset_index()

        topic_stats = []
        for _, row in agg.iterrows():
            accuracy = row["correct"] / row["total"] if row["total"] > 0 else 0.0
            topic_stats.append(TopicStats(
                topic            = row["topic"],
                total_questions  = int(row["total"]),
                correct          = int(row["correct"]),
                incorrect        = int(row["total"]) - int(row["correct"]),
                accuracy         = round(accuracy, 4),
                avg_time_seconds = round(row["avg_time"], 2),
                is_weak          = accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD,
            ))
        topic_stats.sort(key=lambda t: (not t.is_weak, t.accuracy))
        return topic_stats, overall_acc, global_avg

    # ------------------------------------------------------------------
    # Trend — pandas
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_trend_pandas(records):
        df  = pd.DataFrame(records)
        agg = df.groupby("test_id", sort=True).agg(
            accuracy =("is_correct", "mean"),
            avg_time =("time_taken", "mean"),
            count    =("is_correct", "count"),
        ).reset_index()
        return [
            TrendPoint(
                test_id          = int(row["test_id"]),
                accuracy         = round(row["accuracy"], 4),
                avg_time_seconds = round(row["avg_time"], 2),
                questions_count  = int(row["count"]),
            )
            for _, row in agg.iterrows()
        ]

    # ------------------------------------------------------------------
    # Topic stats — stdlib
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_topic_stats_stdlib(records):
        from collections import defaultdict
        buckets = defaultdict(list)
        for r in records:
            buckets[r["topic"]].append(r)

        overall_acc = sum(r["is_correct"] for r in records) / len(records)
        global_avg  = statistics.mean(r["time_taken"] for r in records)
        topic_stats = []

        for topic, rows in buckets.items():
            correct  = sum(r["is_correct"] for r in rows)
            total    = len(rows)
            accuracy = correct / total
            avg_time = statistics.mean(r["time_taken"] for r in rows)
            topic_stats.append(TopicStats(
                topic            = topic,
                total_questions  = total,
                correct          = correct,
                incorrect        = total - correct,
                accuracy         = round(accuracy, 4),
                avg_time_seconds = round(avg_time, 2),
                is_weak          = accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD,
            ))
        topic_stats.sort(key=lambda t: (not t.is_weak, t.accuracy))
        return topic_stats, overall_acc, global_avg

    # ------------------------------------------------------------------
    # Trend — stdlib
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_trend_stdlib(records):
        from collections import defaultdict
        buckets = defaultdict(list)
        for r in records:
            buckets[r["test_id"]].append(r)
        trend = []
        for test_id in sorted(buckets):
            rows = buckets[test_id]
            trend.append(TrendPoint(
                test_id          = test_id,
                accuracy         = round(statistics.mean(r["is_correct"] for r in rows), 4),
                avg_time_seconds = round(statistics.mean(r["time_taken"] for r in rows), 2),
                questions_count  = len(rows),
            ))
        return trend

    # ------------------------------------------------------------------
    # Trend direction
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_trend_direction(trend):
        if len(trend) < 2:
            return "insufficient_data"
        mid   = len(trend) // 2
        first = statistics.mean(t.accuracy for t in trend[:mid])
        last  = statistics.mean(t.accuracy for t in trend[mid:])
        delta = last - first
        if delta > 0.05:
            return "improving"
        if delta < -0.05:
            return "declining"
        return "stable"

    # ------------------------------------------------------------------
    # Tips
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_tips(topic_stats, trend_direction, global_avg_time):
        tips = []
        weak = [t for t in topic_stats if t.is_weak]
        if weak:
            names = ", ".join(t.topic for t in weak)
            tips.append(
                f"Focus revision on weak topics: {names}. "
                "Aim for at least 3 targeted practice sessions per topic."
            )
            slowest = max(weak, key=lambda t: t.avg_time_seconds)
            if slowest.avg_time_seconds > global_avg_time * SLOW_RESPONSE_MULTIPLIER:
                tips.append(
                    f"You spend significantly more time on '{slowest.topic}' "
                    f"({slowest.avg_time_seconds:.0f}s avg vs {global_avg_time:.0f}s global). "
                    "Work on concept clarity to reduce hesitation time."
                )
        if trend_direction == "declining":
            tips.append("Your accuracy has been declining. Review foundational concepts.")
        elif trend_direction == "improving":
            tips.append("Great progress! Accuracy is trending upward. Keep it up!")
        elif trend_direction == "stable":
            tips.append("Performance is stable. Try mixed-topic tests to push higher.")
        strong = [t for t in topic_stats if not t.is_weak]
        if strong:
            best = max(strong, key=lambda t: t.accuracy)
            tips.append(
                f"'{best.topic}' is your strongest area ({best.accuracy*100:.1f}%). "
                "Use it as a confidence anchor during mock tests."
            )
        if not tips:
            tips.append("Keep practising regularly to maintain and improve your performance.")
        return tips

    # ------------------------------------------------------------------
    # Text renderer
    # ------------------------------------------------------------------

    @staticmethod
    def _render_text(report: PerformanceReport) -> str:
        lines = []
        sep = "=" * 60
        lines.append(sep)
        lines.append(" STUDENT PERFORMANCE REPORT — TCAS Model 2 (Merged)")
        lines.append(sep)
        lines.append(f" Overall Accuracy  : {report.overall_accuracy * 100:.1f}%")
        lines.append(f" Total Questions   : {report.total_questions}")
        lines.append(f" Total Tests Taken : {report.total_tests}")
        lines.append(f" Trend Direction   : {report.trend_direction.replace('_', ' ').title()}")
        lines.append(f" ML Prediction     : {report.predicted_label}")
        if report.rf_confidence >= 0:
            lines.append(f" RF Confidence     : {report.rf_confidence * 100:.1f}%")
        lines.append("")

        if report.summary:
            lines.append("── AI Coaching Summary " + "─" * 38)
            lines.append(f" {report.summary}")
            lines.append("")

        if report.study_tips:
            lines.append("── AI Study Tips " + "─" * 43)
            for i, tip in enumerate(report.study_tips, 1):
                lines.append(f" {i}. {tip}")
            lines.append("")

        lines.append("── Topic Breakdown " + "─" * 41)
        lines.append(f" {'Topic':<25} {'Accuracy':>9} {'Correct':>8} {'Total':>7} {'Avg Time':>10} Status")
        lines.append(" " + "-" * 72)
        for t in report.topic_stats:
            status = "⚠ WEAK" if t.is_weak else "✓ OK"
            lines.append(
                f" {t.topic:<25} {t.accuracy*100:>8.1f}%"
                f" {t.correct:>8} {t.total_questions:>7}"
                f" {t.avg_time_seconds:>9.1f}s {status}"
            )
        lines.append("")

        if report.performance_trend:
            lines.append("── Performance Over Tests " + "─" * 35)
            lines.append(f" {'Test ID':>8} {'Accuracy':>10} {'Avg Time':>10} {'Questions':>10}")
            lines.append(" " + "-" * 45)
            for tp in report.performance_trend:
                lines.append(
                    f" {tp.test_id:>8} {tp.accuracy*100:>9.1f}%"
                    f" {tp.avg_time_seconds:>9.1f}s {tp.questions_count:>10}"
                )
            lines.append("")

        lines.append("── Improvement Suggestions " + "─" * 34)
        for i, tip in enumerate(report.improvement_tips, 1):
            lines.append(f" {i}. {tip}")
        lines.append("")
        lines.append(sep)
        return "\n".join(lines)


# ============================================================================
# Convenience factory
# ============================================================================

def analyze(records: list[dict[str, Any]], student_id: int = 0) -> dict[str, Any]:
    """
    One-call entry point for backend integration.
    Returns both stats (Vishal) and RF+Ollama (Keshav) results.
    """
    analyzer = PerformanceAnalyzer(records, student_id=student_id)
    return {
        "json_report":  json.loads(analyzer.get_json_report()),
        "text_summary": analyzer.get_text_summary(),
    }


# ============================================================================
# Quick demo
# ============================================================================

if __name__ == "__main__":
    sample_records = [
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 60, "test_id": 1},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 40, "test_id": 1},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 55, "test_id": 1},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 90, "test_id": 1},
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 70, "test_id": 2},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 50, "test_id": 2},
        {"topic": "Mechanics",      "is_correct": 1, "time_taken": 35, "test_id": 2},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 50, "test_id": 3},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 40, "test_id": 3},
        {"topic": "Optics",         "is_correct": 1, "time_taken": 60, "test_id": 3},
    ]

    result = analyze(sample_records, student_id=42)
    print(result["text_summary"])
