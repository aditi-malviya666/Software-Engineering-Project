from __future__ import annotations
import numpy as np
import pandas as pd
from scipy.stats import linregress
import os

# ── Constants ────────────────────────────────────────────────────────────────
RANDOM_SEED: int = 42
N_ROWS: int = 5_000
N_STUDENTS: int = 200
TOPIC_TAGS: list[str] = ["Optics", "Thermodynamics", "Calculus", "Mechanics", "Electromagnetism", "Algebra", "Trigonometry", "Modern Physics"]
MOVING_AVG_WINDOW: int = 5
OUTPUT_PATH: str = "src/data/performance_dataset.csv"

# ── Synthesis ────────────────────────────────────────────────────────────────
def synthesize_raw_data(rng: np.random.Generator) -> pd.DataFrame:
    student_ids = rng.choice(np.arange(1, N_STUDENTS + 1), size=N_ROWS, replace=True)
    student_base_accuracy = {sid: float(rng.beta(a=2, b=2)) for sid in range(1, N_STUDENTS + 1)}
    is_correct = [int(rng.random() < student_base_accuracy[sid]) for sid in student_ids]
    base_time = rng.integers(30, 121, size=N_ROWS).astype(float)
    penalty = np.where(np.array(is_correct) == 0, rng.integers(0, 31, size=N_ROWS), 0)
    time_taken = base_time + penalty
    topic_tags = rng.choice(TOPIC_TAGS, size=N_ROWS, replace=True)
    
    session_ids = []
    student_question_count = {}
    for sid in student_ids:
        count = student_question_count.get(sid, 0)
        session_ids.append(sid * 1000 + (count // 10))
        student_question_count[sid] = count + 1

    return pd.DataFrame({
        "student_id": student_ids,
        "test_session_id": session_ids,
        "is_correct": is_correct,
        "time_taken_seconds": time_taken.astype(int),
        "topic_tag": topic_tags,
    })

# ── Feature Engineering (REQ-4.1) ────────────────────────────────────────────
def _trend_slope(series: pd.Series) -> float:
    if len(series) < 2:
        return 0.0
    x = np.arange(len(series), dtype=float)
    slope, *_ = linregress(x, series.astype(float))
    return round(float(slope), 6)

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    student_stats = df.groupby("student_id").agg(
        avg_accuracy=("is_correct", "mean"),
        n_sessions=("test_session_id", "nunique"),
    ).reset_index()

    latency_ema = df.sort_values(["student_id", "test_session_id"]).groupby("student_id")["time_taken_seconds"].apply(
        lambda s: float(s.ewm(span=MOVING_AVG_WINDOW).mean().iloc[-1])
    ).reset_index().rename(columns={"time_taken_seconds": "moving_avg_latency"})

    session_accuracy = df.groupby(["student_id", "test_session_id"])["is_correct"].mean().reset_index().rename(columns={"is_correct": "session_acc"})

    trend = session_accuracy.sort_values(["student_id", "test_session_id"]).groupby("student_id")["session_acc"].apply(_trend_slope).reset_index().rename(columns={"session_acc": "trend_slope"})

    features = student_stats.merge(latency_ema, on="student_id").merge(trend, on="student_id")

    conditions = [features["avg_accuracy"] >= 0.70, features["avg_accuracy"] >= 0.45]
    choices = ["Excellent", "Stable"]
    features["performance_label"] = np.select(conditions, choices, default="Needs Improvement")

    return features.round({"avg_accuracy": 4, "moving_avg_latency": 2, "trend_slope": 6})

# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    rng = np.random.default_rng(RANDOM_SEED)
    print("Synthesizing raw data …")
    raw_df = synthesize_raw_data(rng)
    print("Engineering features (REQ-4.1) …")
    features_df = engineer_features(raw_df)
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    features_df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nDataset saved → {OUTPUT_PATH}")