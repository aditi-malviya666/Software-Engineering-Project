"""
model2_bridge.py
────────────────
Bridge between Vishal's model2_analyzer data format and
Keshav's Random Forest model (model2_rf.pkl).

Vishal's format:   { "topic", "is_correct", "time_taken", "test_id" }
Keshav's format:   { "topic_tag", "is_correct", "time_taken_seconds", "test_session_id" }

This file patches model2_performance_analyzer.py to also run
the RF model + Ollama coaching on top of the stats engine.

Drop this file into:
    models/model2_analyzer/model2_bridge.py
"""

from __future__ import annotations

import os
import pickle
import traceback
from typing import Any

import numpy as np
import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────

MIN_SESSIONS: int = 3
FEATURE_COLS = ["avg_accuracy", "moving_avg_latency", "trend_slope"]

_HERE = os.path.dirname(os.path.abspath(__file__))
_RF_MODEL_PATH = os.path.join(_HERE, "model2_rf.pkl")


# ── Load RF Model ─────────────────────────────────────────────────────────────

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


RF_PIPELINE = _load_rf()


# ── Format Converter ──────────────────────────────────────────────────────────

def convert_to_keshav_format(records: list[dict]) -> list[dict]:
    """
    Convert Vishal's record format to Keshav's format.

    Vishal: { topic, is_correct, time_taken, test_id }
    Keshav: { topic_tag, is_correct, time_taken_seconds, test_session_id }
    """
    return [
        {
            "topic_tag":         r["topic"],
            "is_correct":        r["is_correct"],
            "time_taken_seconds": r["time_taken"],
            "test_session_id":   r["test_id"],
        }
        for r in records
    ]


# ── Feature Engineering (matches train_model.py exactly) ─────────────────────

def engineer_features(records: list[dict]) -> tuple[pd.DataFrame, float, float, float]:
    """
    Build the 3 features the RF model was trained on:
      - avg_accuracy
      - moving_avg_latency
      - trend_slope

    Input: Keshav-format records (topic_tag, is_correct, time_taken_seconds, test_session_id)
    """
    df = pd.DataFrame(records)

    avg_accuracy = float(df["is_correct"].mean())

    moving_avg_latency = float(
        df.sort_values("test_session_id")["time_taken_seconds"]
        .ewm(span=5)
        .mean()
        .iloc[-1]
    )

    session_acc = (
        df.groupby("test_session_id")["is_correct"]
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
        columns=FEATURE_COLS,
    )
    return feature_row, avg_accuracy, moving_avg_latency, trend_slope


# ── Weak Topic Detection ──────────────────────────────────────────────────────

def get_weak_topics(records: list[dict]) -> tuple[list[str], dict[str, float]]:
    """
    Identify weak topics using Keshav's smart 3-priority logic.
    Input: Keshav-format records.
    """
    df = pd.DataFrame(records)
    avg_accuracy = float(df["is_correct"].mean())

    topic_acc = df.groupby("topic_tag")["is_correct"].mean().sort_values()
    topic_accuracies = {t: round(float(v), 4) for t, v in topic_acc.items()}

    # Priority 1: below 50%
    weak = topic_acc[topic_acc < 0.50].index.tolist()
    # Priority 2: below student's own average
    if not weak:
        weak = topic_acc[topic_acc < avg_accuracy].index.tolist()
    # Priority 3: just the lowest
    if not weak:
        weak = [topic_acc.index[0]]

    return weak[:3], topic_accuracies


# ── Ollama Coaching ───────────────────────────────────────────────────────────

def get_ollama_coaching(
    rf_label: str,
    weak_topics: list[str],
    avg_accuracy: float,
    student_id: int = 0,
) -> tuple[str, list[str], str]:
    """
    Get AI coaching from Ollama using Keshav's qualitative engine.
    Falls back gracefully if Ollama is not running.

    Returns: (summary, study_tips, model_used)
    """
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


# ── Main Public Function ──────────────────────────────────────────────────────

def rf_analyze(records: list[dict], student_id: int = 0) -> dict[str, Any]:
    """
    Full RF + Ollama analysis on top of Vishal's stats engine.

    Parameters
    ----------
    records : list[dict]
        Vishal's format: { topic, is_correct, time_taken, test_id }
    student_id : int
        Optional student ID for Ollama prompt context.

    Returns
    -------
    dict with keys:
        rf_label, avg_accuracy, moving_avg_latency, trend_slope,
        weak_topics, topic_accuracies, summary, study_tips, model_used,
        session_count, rf_available
    """
    # Check minimum sessions
    session_count = len({r["test_id"] for r in records})

    # Convert to Keshav's format
    keshav_records = convert_to_keshav_format(records)

    # Engineer features
    feature_row, avg_accuracy, moving_avg_latency, trend_slope = engineer_features(
        keshav_records
    )

    # Get weak topics
    weak_topics, topic_accuracies = get_weak_topics(keshav_records)

    # RF prediction
    rf_label = "N/A"
    if RF_PIPELINE is not None:
        try:
            rf_label = str(RF_PIPELINE.predict(feature_row)[0])
        except Exception as e:
            print(f"[WARN] RF prediction failed: {e}")
            rf_label = "Stable"  # safe fallback
    else:
        # Fallback: rule-based label if RF not loaded
        if avg_accuracy >= 0.75:
            rf_label = "Excellent"
        elif avg_accuracy >= 0.50:
            rf_label = "Stable"
        else:
            rf_label = "Needs Improvement"

    # Ollama coaching
    summary, study_tips, model_used = get_ollama_coaching(
        rf_label, weak_topics, avg_accuracy, student_id
    )

    return {
        "rf_label":           rf_label,
        "rf_available":       RF_PIPELINE is not None,
        "avg_accuracy":       round(avg_accuracy, 4),
        "moving_avg_latency": round(moving_avg_latency, 2),
        "trend_slope":        round(trend_slope, 6),
        "weak_topics":        weak_topics,
        "topic_accuracies":   topic_accuracies,
        "summary":            summary,
        "study_tips":         study_tips,
        "model_used":         model_used,
        "session_count":      session_count,
    }
