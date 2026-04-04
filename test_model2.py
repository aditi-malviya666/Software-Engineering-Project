"""
=============================================================================
  test_model2.py — Unit tests for Model 2 Performance Analyser
  Run:  python -m pytest test_model2.py -v
=============================================================================
"""
import json
import pytest
from model2_performance_analyzer import PerformanceAnalyzer, analyze

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
 
SAMPLE_RECORDS = [
    {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 60, "test_id": 1},
    {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 40, "test_id": 1},
    {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 75, "test_id": 1},
    {"topic": "Calculus",       "is_correct": 1, "time_taken": 55, "test_id": 1},
    {"topic": "Calculus",       "is_correct": 1, "time_taken": 45, "test_id": 1},
    {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 50, "test_id": 2},
    {"topic": "Calculus",       "is_correct": 0, "time_taken": 90, "test_id": 2},
    {"topic": "Calculus",       "is_correct": 1, "time_taken": 50, "test_id": 2},
    {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 45, "test_id": 3},
    {"topic": "Calculus",       "is_correct": 1, "time_taken": 40, "test_id": 3},
]
 
 
# ---------------------------------------------------------------------------
# Basic functionality
# ---------------------------------------------------------------------------
 
class TestBasicFunctionality:
 
    def test_json_output_is_valid_json(self):
        a = PerformanceAnalyzer(SAMPLE_RECORDS)
        raw = a.get_json_report()
        parsed = json.loads(raw)           # must not raise
        assert isinstance(parsed, dict)
 
    def test_text_summary_is_string(self):
        a = PerformanceAnalyzer(SAMPLE_RECORDS)
        summary = a.get_text_summary()
        assert isinstance(summary, str)
        assert len(summary) > 100          # sanity: not empty
 
    def test_required_json_keys_present(self):
        result = json.loads(PerformanceAnalyzer(SAMPLE_RECORDS).get_json_report())
        for key in [
            "overall_accuracy", "total_questions", "total_tests",
            "topic_stats", "weak_topics", "performance_trend",
            "improvement_tips", "trend_direction",
        ]:
            assert key in result, f"Missing key: {key}"
 
    def test_convenience_analyze_function(self):
        result = analyze(SAMPLE_RECORDS)
        assert "json_report" in result
        assert "text_summary" in result
        assert isinstance(result["json_report"], dict)
        assert isinstance(result["text_summary"], str)
 
 
# ---------------------------------------------------------------------------
# Accuracy calculations
# ---------------------------------------------------------------------------
 
class TestAccuracyCalculations:
 
    def test_overall_accuracy_range(self):
        result = json.loads(PerformanceAnalyzer(SAMPLE_RECORDS).get_json_report())
        acc = result["overall_accuracy"]
        assert 0.0 <= acc <= 1.0
 
    def test_perfect_accuracy(self):
        records = [{"topic": "Math", "is_correct": 1, "time_taken": 30, "test_id": 1}] * 5
        result  = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["overall_accuracy"] == 1.0
 
    def test_zero_accuracy(self):
        records = [{"topic": "Math", "is_correct": 0, "time_taken": 30, "test_id": 1}] * 5
        result  = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["overall_accuracy"] == 0.0
        assert "Math" in result["weak_topics"]
 
    def test_topic_correct_and_incorrect_counts(self):
        records = [
            {"topic": "Physics", "is_correct": 1, "time_taken": 30, "test_id": 1},
            {"topic": "Physics", "is_correct": 0, "time_taken": 30, "test_id": 1},
            {"topic": "Physics", "is_correct": 1, "time_taken": 30, "test_id": 1},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        physics = next(t for t in result["topic_stats"] if t["topic"] == "Physics")
        assert physics["correct"]   == 2
        assert physics["incorrect"] == 1
        assert physics["total_questions"] == 3
        assert abs(physics["accuracy"] - 2/3) < 1e-4
 
 
# ---------------------------------------------------------------------------
# Weak topics
# ---------------------------------------------------------------------------
 
class TestWeakTopics:
 
    def test_weak_topic_flagged_correctly(self):
        records = [
            {"topic": "Optics",  "is_correct": 0, "time_taken": 60, "test_id": 1},
            {"topic": "Optics",  "is_correct": 0, "time_taken": 60, "test_id": 1},
            {"topic": "Optics",  "is_correct": 1, "time_taken": 60, "test_id": 1},  # 33%
            {"topic": "Calculus","is_correct": 1, "time_taken": 30, "test_id": 1},
            {"topic": "Calculus","is_correct": 1, "time_taken": 30, "test_id": 1},  # 100%
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert "Optics"   in result["weak_topics"]
        assert "Calculus" not in result["weak_topics"]
 
    def test_exactly_50_percent_not_weak(self):
        """Boundary: accuracy == 0.50 → NOT weak (threshold is strictly <)."""
        records = [
            {"topic": "Stats", "is_correct": 1, "time_taken": 30, "test_id": 1},
            {"topic": "Stats", "is_correct": 0, "time_taken": 30, "test_id": 1},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert "Stats" not in result["weak_topics"]
 
 
# ---------------------------------------------------------------------------
# Trend detection
# ---------------------------------------------------------------------------
 
class TestTrendDetection:
 
    def test_improving_trend(self):
        records = [
            {"topic": "X", "is_correct": 0, "time_taken": 30, "test_id": 1},
            {"topic": "X", "is_correct": 0, "time_taken": 30, "test_id": 1},
            {"topic": "X", "is_correct": 1, "time_taken": 30, "test_id": 2},
            {"topic": "X", "is_correct": 1, "time_taken": 30, "test_id": 3},
            {"topic": "X", "is_correct": 1, "time_taken": 30, "test_id": 4},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["trend_direction"] == "improving"
 
    def test_single_test_insufficient_data(self):
        records = [
            {"topic": "X", "is_correct": 1, "time_taken": 30, "test_id": 1},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["trend_direction"] == "insufficient_data"
 
 
# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------
 
class TestEdgeCases:
 
    def test_empty_input(self):
        result = json.loads(PerformanceAnalyzer([]).get_json_report())
        assert result["total_questions"] == 0
        assert result["trend_direction"] == "insufficient_data"
 
    def test_non_dict_records_skipped(self):
        records = [
            "bad_record",
            None,
            {"topic": "Math", "is_correct": 1, "time_taken": 30, "test_id": 1},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["total_questions"] == 1   # only valid record counted
 
    def test_missing_key_records_skipped(self):
        records = [
            {"topic": "Math", "is_correct": 1, "time_taken": 30},  # missing test_id
            {"topic": "Physics", "is_correct": 1, "time_taken": 45, "test_id": 2},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["total_questions"] == 1
 
    def test_negative_time_coerced_to_zero(self):
        records = [
            {"topic": "Math", "is_correct": 1, "time_taken": -10, "test_id": 1},
        ]
        result = json.loads(PerformanceAnalyzer(records).get_json_report())
        assert result["topic_stats"][0]["avg_time_seconds"] == 0.0
 
    def test_tips_always_present(self):
        result = json.loads(PerformanceAnalyzer(SAMPLE_RECORDS).get_json_report())
        assert isinstance(result["improvement_tips"], list)
        assert len(result["improvement_tips"]) >= 1
 
    def test_report_is_idempotent(self):
        """Calling build_report() twice returns the same result (caching)."""
        a = PerformanceAnalyzer(SAMPLE_RECORDS)
        r1 = a.get_json_report()
        r2 = a.get_json_report()
        assert r1 == r2
 