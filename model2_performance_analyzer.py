"""
=============================================================================
  Model 2 — Student Performance Analysis Module
  Project: Test Conduction and Assessment System (TCAS)
=============================================================================
  Responsibilities:
    - Ingest raw CBT question-level records
    - Compute per-topic and overall statistics
    - Detect performance trends across tests
    - Identify weak topics
    - Emit a structured JSON report + a human-readable summary
 
  Input schema (list of dicts / JSON array):
    {
      "topic":      str,   # Subject area / topic name
      "is_correct": 0|1,  # Whether the student answered correctly
      "time_taken": int,  # Seconds spent on the question
      "test_id":    int   # Identifier of the CBT session
    }
 
  Public API:
    analyzer = PerformanceAnalyzer(records)
    json_report  = analyzer.get_json_report()
    text_summary = analyzer.get_text_summary()
=============================================================================
"""
 
from __future__ import annotations
 
import json
import statistics
from dataclasses import dataclass, field, asdict
from typing import Any
 
# ---------------------------------------------------------------------------
# Optional dependency: pandas.  Fall back to stdlib if not installed.
# ---------------------------------------------------------------------------
try:
    import pandas as pd
    _PANDAS_AVAILABLE = True
except ImportError:
    _PANDAS_AVAILABLE = False
 
 
# ---------------------------------------------------------------------------
# Constants / thresholds
# ---------------------------------------------------------------------------
WEAK_TOPIC_ACCURACY_THRESHOLD = 0.50   # accuracy < 50 % → weak topic
SLOW_RESPONSE_MULTIPLIER      = 1.5    # avg_time > 1.5 × global avg → slow
 
 
# ============================================================================
# Data-class models (used for clean serialisation)
# ============================================================================
 
@dataclass
class TopicStats:
    topic:            str
    total_questions:  int
    correct:          int
    incorrect:        int
    accuracy:         float          # 0.0 – 1.0
    avg_time_seconds: float
    is_weak:          bool
 
 
@dataclass
class TrendPoint:
    test_id:          int
    accuracy:         float
    avg_time_seconds: float
    questions_count:  int
 
 
@dataclass
class PerformanceReport:
    overall_accuracy:     float
    total_questions:      int
    total_tests:          int
    topic_stats:          list[TopicStats]
    weak_topics:          list[str]
    performance_trend:    list[TrendPoint]
    improvement_tips:     list[str]
    trend_direction:      str          # "improving" | "declining" | "stable" | "insufficient_data"
 
 
# ============================================================================
# Core analyser
# ============================================================================
 
class PerformanceAnalyzer:
    """
    Analyses a student's CBT results and produces structured insights.
 
    Parameters
    ----------
    records : list[dict]
        Raw question-level records.  Each dict must contain the keys:
        ``topic``, ``is_correct``, ``time_taken``, ``test_id``.
    """
 
    def __init__(self, records: list[dict[str, Any]]) -> None:
        self._raw = records
        self._report: PerformanceReport | None = None   # lazy-built cache
 
    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------
 
    def get_json_report(self, indent: int = 2) -> str:
        """Return the full analysis as a JSON string (API-ready)."""
        report = self._build_report()
        return json.dumps(asdict(report), indent=indent, ensure_ascii=False)
 
    def get_text_summary(self) -> str:
        """Return a human-readable, plain-text performance summary."""
        report = self._build_report()
        return self._render_text(report)
 
    # ------------------------------------------------------------------
    # Internal: build report (with caching)
    # ------------------------------------------------------------------
 
    def _build_report(self) -> PerformanceReport:
        if self._report is not None:
            return self._report
 
        records = self._validate_and_clean(self._raw)
 
        if not records:
            # Edge-case: no usable data
            self._report = PerformanceReport(
                overall_accuracy=0.0,
                total_questions=0,
                total_tests=0,
                topic_stats=[],
                weak_topics=[],
                performance_trend=[],
                improvement_tips=["No valid data provided. Please supply test records."],
                trend_direction="insufficient_data",
            )
            return self._report
 
        if _PANDAS_AVAILABLE:
            topic_stats, overall_acc, global_avg_time = self._compute_topic_stats_pandas(records)
            trend = self._compute_trend_pandas(records)
        else:
            topic_stats, overall_acc, global_avg_time = self._compute_topic_stats_stdlib(records)
            trend = self._compute_trend_stdlib(records)
 
        weak_topics     = [t.topic for t in topic_stats if t.is_weak]
        trend_direction = self._detect_trend_direction(trend)
        tips            = self._generate_tips(topic_stats, trend_direction, global_avg_time)
 
        total_tests = len({r["test_id"] for r in records})
 
        self._report = PerformanceReport(
            overall_accuracy=round(overall_acc, 4),
            total_questions=len(records),
            total_tests=total_tests,
            topic_stats=topic_stats,
            weak_topics=weak_topics,
            performance_trend=trend,
            improvement_tips=tips,
            trend_direction=trend_direction,
        )
        return self._report
 
    # ------------------------------------------------------------------
    # Validation / cleaning
    # ------------------------------------------------------------------
 
    @staticmethod
    def _validate_and_clean(records: list[dict]) -> list[dict]:
        """
        Drop records that are missing required fields or have invalid values.
        Coerce types where possible.
        """
        required_keys = {"topic", "is_correct", "time_taken", "test_id"}
        cleaned: list[dict] = []
 
        for i, rec in enumerate(records):
            # Must be a dict
            if not isinstance(rec, dict):
                print(f"[WARN] Record #{i} is not a dict — skipped.")
                continue
 
            # Must have all required keys
            if not required_keys.issubset(rec.keys()):
                missing = required_keys - rec.keys()
                print(f"[WARN] Record #{i} missing keys {missing} — skipped.")
                continue
 
            # Coerce / validate values
            try:
                cleaned.append({
                    "topic":      str(rec["topic"]).strip() or "Unknown",
                    "is_correct": int(rec["is_correct"]),          # raises if non-numeric
                    "time_taken": max(0, float(rec["time_taken"])), # negative time → 0
                    "test_id":    int(rec["test_id"]),
                })
            except (ValueError, TypeError) as exc:
                print(f"[WARN] Record #{i} has bad value ({exc}) — skipped.")
 
        return cleaned
 
    # ------------------------------------------------------------------
    # Topic-level statistics — pandas path
    # ------------------------------------------------------------------
 
    @staticmethod
    def _compute_topic_stats_pandas(
        records: list[dict],
    ) -> tuple[list[TopicStats], float, float]:
        """Use pandas groupby for efficient aggregation."""
        df = pd.DataFrame(records)
 
        # Overall metrics
        overall_acc    = df["is_correct"].mean()
        global_avg_time = df["time_taken"].mean()
 
        # Per-topic aggregation
        grp = df.groupby("topic", sort=False)
        agg = grp.agg(
            total=("is_correct", "count"),
            correct=("is_correct", "sum"),
            avg_time=("time_taken", "mean"),
        ).reset_index()
 
        topic_stats: list[TopicStats] = []
        for _, row in agg.iterrows():
            accuracy = row["correct"] / row["total"] if row["total"] > 0 else 0.0
            topic_stats.append(TopicStats(
                topic=row["topic"],
                total_questions=int(row["total"]),
                correct=int(row["correct"]),
                incorrect=int(row["total"]) - int(row["correct"]),
                accuracy=round(accuracy, 4),
                avg_time_seconds=round(row["avg_time"], 2),
                is_weak=accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD,
            ))
 
        # Sort: weak topics first, then by accuracy ascending
        topic_stats.sort(key=lambda t: (not t.is_weak, t.accuracy))
        return topic_stats, overall_acc, global_avg_time
 
    # ------------------------------------------------------------------
    # Trend across tests — pandas path
    # ------------------------------------------------------------------
 
    @staticmethod
    def _compute_trend_pandas(records: list[dict]) -> list[TrendPoint]:
        df = pd.DataFrame(records)
        grp = df.groupby("test_id", sort=True)
        agg = grp.agg(
            accuracy=("is_correct", "mean"),
            avg_time=("time_taken", "mean"),
            count=("is_correct", "count"),
        ).reset_index()
 
        return [
            TrendPoint(
                test_id=int(row["test_id"]),
                accuracy=round(row["accuracy"], 4),
                avg_time_seconds=round(row["avg_time"], 2),
                questions_count=int(row["count"]),
            )
            for _, row in agg.iterrows()
        ]
 
    # ------------------------------------------------------------------
    # Topic-level statistics — stdlib path (no pandas)
    # ------------------------------------------------------------------
 
    @staticmethod
    def _compute_topic_stats_stdlib(
        records: list[dict],
    ) -> tuple[list[TopicStats], float, float]:
        from collections import defaultdict
 
        buckets: dict[str, list[dict]] = defaultdict(list)
        for r in records:
            buckets[r["topic"]].append(r)
 
        overall_correct = sum(r["is_correct"] for r in records)
        overall_acc     = overall_correct / len(records)
        global_avg_time = statistics.mean(r["time_taken"] for r in records)
 
        topic_stats: list[TopicStats] = []
        for topic, rows in buckets.items():
            correct  = sum(r["is_correct"] for r in rows)
            total    = len(rows)
            accuracy = correct / total
            avg_time = statistics.mean(r["time_taken"] for r in rows)
            topic_stats.append(TopicStats(
                topic=topic,
                total_questions=total,
                correct=correct,
                incorrect=total - correct,
                accuracy=round(accuracy, 4),
                avg_time_seconds=round(avg_time, 2),
                is_weak=accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD,
            ))
 
        topic_stats.sort(key=lambda t: (not t.is_weak, t.accuracy))
        return topic_stats, overall_acc, global_avg_time
 
    # ------------------------------------------------------------------
    # Trend across tests — stdlib path
    # ------------------------------------------------------------------
 
    @staticmethod
    def _compute_trend_stdlib(records: list[dict]) -> list[TrendPoint]:
        from collections import defaultdict
 
        buckets: dict[int, list[dict]] = defaultdict(list)
        for r in records:
            buckets[r["test_id"]].append(r)
 
        trend: list[TrendPoint] = []
        for test_id in sorted(buckets):
            rows = buckets[test_id]
            accuracy = statistics.mean(r["is_correct"] for r in rows)
            avg_time = statistics.mean(r["time_taken"] for r in rows)
            trend.append(TrendPoint(
                test_id=test_id,
                accuracy=round(accuracy, 4),
                avg_time_seconds=round(avg_time, 2),
                questions_count=len(rows),
            ))
        return trend
 
    # ------------------------------------------------------------------
    # Trend direction detection
    # ------------------------------------------------------------------
 
    @staticmethod
    def _detect_trend_direction(trend: list[TrendPoint]) -> str:
        """
        Compare first-half vs second-half average accuracy to decide if the
        student is improving, declining, or stable.
        Requires at least 2 test sessions.
        """
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
    # Improvement tip generation
    # ------------------------------------------------------------------
 
    @staticmethod
    def _generate_tips(
        topic_stats: list[TopicStats],
        trend_direction: str,
        global_avg_time: float,
    ) -> list[str]:
        tips: list[str] = []
 
        # Weak topic tips
        weak = [t for t in topic_stats if t.is_weak]
        if weak:
            names = ", ".join(t.topic for t in weak)
            tips.append(
                f"Focus revision on weak topics: {names}. "
                "Aim for at least 3 targeted practice sessions per topic."
            )
            # Slowest weak topic
            slowest = max(weak, key=lambda t: t.avg_time_seconds)
            if slowest.avg_time_seconds > global_avg_time * SLOW_RESPONSE_MULTIPLIER:
                tips.append(
                    f"You spend significantly more time on '{slowest.topic}' "
                    f"({slowest.avg_time_seconds:.0f}s avg vs "
                    f"{global_avg_time:.0f}s global avg). "
                    "Work on concept clarity to reduce hesitation time."
                )
 
        # Trend-based tips
        if trend_direction == "declining":
            tips.append(
                "Your accuracy has been declining across recent tests. "
                "Consider reviewing foundational concepts and spacing out your study sessions."
            )
        elif trend_direction == "improving":
            tips.append(
                "Great progress! Your accuracy is trending upward. "
                "Keep up the consistent practice and challenge yourself with harder problems."
            )
        elif trend_direction == "stable":
            tips.append(
                "Your performance is stable but could be pushed higher. "
                "Try mixed-topic practice tests to break through the plateau."
            )
 
        # Strong topics — reinforce
        strong = [t for t in topic_stats if not t.is_weak]
        if strong:
            best = max(strong, key=lambda t: t.accuracy)
            tips.append(
                f"'{best.topic}' is your strongest area ({best.accuracy*100:.1f}% accuracy). "
                "Use it as a confidence anchor during full-length mock tests."
            )
 
        # Speed tip
        slow_topics = [
            t for t in topic_stats
            if t.avg_time_seconds > global_avg_time * SLOW_RESPONSE_MULTIPLIER
        ]
        if slow_topics:
            names = ", ".join(t.topic for t in slow_topics)
            tips.append(
                f"Practice timed drills for: {names} to improve answer speed."
            )
 
        if not tips:
            tips.append("Keep practising regularly to maintain and improve your performance.")
 
        return tips
 
    # ------------------------------------------------------------------
    # Plain-text renderer
    # ------------------------------------------------------------------
 
    @staticmethod
    def _render_text(report: PerformanceReport) -> str:
        lines: list[str] = []
        sep = "=" * 60
 
        lines.append(sep)
        lines.append("  STUDENT PERFORMANCE REPORT  —  TCAS Model 2")
        lines.append(sep)
        lines.append(f"  Overall Accuracy  : {report.overall_accuracy * 100:.1f}%")
        lines.append(f"  Total Questions   : {report.total_questions}")
        lines.append(f"  Total Tests Taken : {report.total_tests}")
        lines.append(f"  Performance Trend : {report.trend_direction.replace('_', ' ').title()}")
        lines.append("")
 
        # Per-topic breakdown
        lines.append("── Topic Breakdown " + "─" * 42)
        header = f"  {'Topic':<25} {'Accuracy':>9} {'Correct':>8} {'Total':>7} {'Avg Time':>10}  Status"
        lines.append(header)
        lines.append("  " + "-" * 72)
        for t in report.topic_stats:
            status = "⚠ WEAK" if t.is_weak else "✓ OK"
            lines.append(
                f"  {t.topic:<25} {t.accuracy*100:>8.1f}%"
                f" {t.correct:>8} {t.total_questions:>7}"
                f" {t.avg_time_seconds:>9.1f}s  {status}"
            )
        lines.append("")
 
        # Trend table
        if report.performance_trend:
            lines.append("── Performance Over Tests " + "─" * 35)
            lines.append(f"  {'Test ID':>8} {'Accuracy':>10} {'Avg Time':>10} {'Questions':>10}")
            lines.append("  " + "-" * 45)
            for tp in report.performance_trend:
                lines.append(
                    f"  {tp.test_id:>8} {tp.accuracy*100:>9.1f}%"
                    f" {tp.avg_time_seconds:>9.1f}s {tp.questions_count:>10}"
                )
            lines.append("")
 
        # Weak areas
        if report.weak_topics:
            lines.append("── Weak Areas " + "─" * 47)
            for w in report.weak_topics:
                lines.append(f"  • {w}")
            lines.append("")
 
        # Improvement tips
        lines.append("── Improvement Suggestions " + "─" * 34)
        for i, tip in enumerate(report.improvement_tips, 1):
            # Word-wrap at ~70 chars
            words = tip.split()
            current_line = f"  {i}. "
            for word in words:
                if len(current_line) + len(word) + 1 > 74:
                    lines.append(current_line)
                    current_line = "     " + word + " "
                else:
                    current_line += word + " "
            lines.append(current_line.rstrip())
        lines.append("")
        lines.append(sep)
 
        return "\n".join(lines)
 
 
# ============================================================================
# Convenience factory — easy to wire into a FastAPI / Flask route
# ============================================================================
 
def analyze(records: list[dict[str, Any]]) -> dict[str, Any]:
    """
    One-call entry point for backend integration.
 
    Returns
    -------
    dict with keys:
      - ``json_report``  : parsed dict (ready to return as JSON response)
      - ``text_summary`` : plain-text string
    """
    analyzer = PerformanceAnalyzer(records)
    return {
        "json_report":  json.loads(analyzer.get_json_report()),
        "text_summary": analyzer.get_text_summary(),
    }
 
 
# ============================================================================
# Quick demo (run: python model2_performance_analyzer.py)
# ============================================================================
 
if __name__ == "__main__":
    sample_records = [
        # Test 1
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 60, "test_id": 1},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 40, "test_id": 1},
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 75, "test_id": 1},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 55, "test_id": 1},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 45, "test_id": 1},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 90, "test_id": 1},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 85, "test_id": 1},
        # Test 2
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 70, "test_id": 2},
        {"topic": "Calculus",       "is_correct": 0, "time_taken": 90, "test_id": 2},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 50, "test_id": 2},
        {"topic": "Mechanics",      "is_correct": 1, "time_taken": 35, "test_id": 2},
        {"topic": "Mechanics",      "is_correct": 1, "time_taken": 30, "test_id": 2},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 95, "test_id": 2},
        # Test 3
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 50, "test_id": 3},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 45, "test_id": 3},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 40, "test_id": 3},
        {"topic": "Optics",         "is_correct": 1, "time_taken": 60, "test_id": 3},
        {"topic": "Mechanics",      "is_correct": 1, "time_taken": 28, "test_id": 3},
    ]
 
    result = analyze(sample_records)
 
    print(result["text_summary"])
    print("\n[JSON Report Preview — first 800 chars]\n")
    print(json.dumps(result["json_report"], indent=2)[:800] + "\n...")
 