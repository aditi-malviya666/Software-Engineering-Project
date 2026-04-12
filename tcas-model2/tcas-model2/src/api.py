"""
api.py — TCAS Model 2 inference endpoint
"""

from __future__ import annotations

import pickle
import traceback
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from models.qualitative_engine import (
    QualitativeInput,
    QualitativeOutput,
    generate_qualitative_analysis,
)
# ── Constants ─────────────────────────────────────────────────────────────────

MODEL_PATH:   str       = "src/models/model2_rf.pkl"
FEATURE_COLS: list[str] = ["avg_accuracy", "moving_avg_latency", "trend_slope"]
MIN_SESSIONS: int       = 3

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="TCAS Model 2 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _load_rf_model() -> Any:
    path = Path(MODEL_PATH)
    if not path.exists():
        raise FileNotFoundError(f"Model not found at '{MODEL_PATH}'.")
    with open(path, "rb") as fh:
        return pickle.load(fh)


try:
    RF_PIPELINE = _load_rf_model()
    print("✅ Random Forest model loaded.")
except FileNotFoundError as e:
    RF_PIPELINE = None
    print(f"⚠️  {e}")


# ── Schemas ───────────────────────────────────────────────────────────────────

class TestAttempt(BaseModel):
    test_session_id:    int = Field(..., description="Session identifier.")
    is_correct:         int = Field(..., ge=0, le=1)
    time_taken_seconds: int = Field(..., gt=0)
    topic_tag:          str = Field(..., min_length=1)


class AnalyseRequest(BaseModel):
    student_id: int               = Field(..., gt=0)
    attempts:   list[TestAttempt] = Field(..., min_length=1)

    @field_validator("attempts")
    @classmethod
    def validate_three_test_rule(cls, attempts: list[TestAttempt]) -> list[TestAttempt]:
        session_count = len({a.test_session_id for a in attempts})
        if session_count < MIN_SESSIONS:
            raise ValueError(
                f"Business Rule 7.5: only {session_count} session(s) found. "
                f"Minimum {MIN_SESSIONS} required."
            )
        return attempts


class AnalyseResponse(BaseModel):
    student_id:         int
    session_count:      int
    rf_label:           str
    avg_accuracy:       float
    moving_avg_latency: float
    trend_slope:        float
    weak_topics:        list[str]
    topic_accuracies:   dict[str, float]
    summary:            str
    study_tips:         list[str]
    model_used:         str


class HealthResponse(BaseModel):
    status:                str
    rf_model_loaded:       bool
    min_sessions_required: int


# ── Feature Engineering ───────────────────────────────────────────────────────

def _engineer_features(
    attempts: list[TestAttempt],
) -> tuple[pd.DataFrame, list[str], dict[str, float], int]:
    """
    Compute REQ-4.1 features and identify weak topics smartly.

    Weak topic logic (priority order):
      1. Topics below 50% accuracy → clearly weak
      2. If none below 50%, topics below the student's own average
      3. If all equal, return only the single lowest topic
    """
    df = pd.DataFrame([a.model_dump() for a in attempts])

    avg_accuracy: float = float(df["is_correct"].mean())

    moving_avg_latency: float = float(
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

    # ── Smart weak topic calculation ──────────────────────────────────────────
    topic_acc: pd.Series = (
        df.groupby("topic_tag")["is_correct"]
        .mean()
        .sort_values()
    )

    topic_accuracies: dict[str, float] = {
        t: round(float(v), 4) for t, v in topic_acc.items()
    }

    print(f"\n📊 Topic accuracies: {topic_accuracies}")
    print(f"📈 Student avg: {avg_accuracy:.2f}")

    # Priority 1 — below 50%
    weak = topic_acc[topic_acc < 0.50].index.tolist()

    # Priority 2 — below student's own average
    if not weak:
        weak = topic_acc[topic_acc < avg_accuracy].index.tolist()

    # Priority 3 — just the single lowest
    if not weak:
        weak = [topic_acc.index[0]]

    weak = weak[:3]
    print(f"⚠️  Weak topics: {weak}")

    session_count: int = df["test_session_id"].nunique()

    feature_row = pd.DataFrame(
        [[avg_accuracy, moving_avg_latency, trend_slope]],
        columns=FEATURE_COLS,
    )

    return feature_row, weak, topic_accuracies, session_count


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        rf_model_loaded=RF_PIPELINE is not None,
        min_sessions_required=MIN_SESSIONS,
    )


@app.post("/api/v1/analyse", response_model=AnalyseResponse, tags=["Inference"])
def analyse(request: AnalyseRequest) -> AnalyseResponse:
    if RF_PIPELINE is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Run train_model.py first.",
        )

    feature_row, weak_topics, topic_accuracies, session_count = _engineer_features(
        request.attempts
    )

    avg_accuracy:       float = round(float(feature_row["avg_accuracy"].iloc[0]), 4)
    moving_avg_latency: float = round(float(feature_row["moving_avg_latency"].iloc[0]), 2)
    trend_slope:        float = round(float(feature_row["trend_slope"].iloc[0]), 6)

    rf_label: str = str(RF_PIPELINE.predict(feature_row)[0])
    print(f"🤖 RF: {rf_label} | Acc: {avg_accuracy} | Weak: {weak_topics}")

    # ── Ollama ────────────────────────────────────────────────────────────────
    try:
        qi = QualitativeInput(
            rf_label=rf_label,
            weak_topics=weak_topics if weak_topics else ["General"],
            student_id=request.student_id,
            avg_accuracy=avg_accuracy,
        )
        qual: QualitativeOutput = generate_qualitative_analysis(qi)
        summary    = qual.summary
        study_tips = qual.study_tips
        model_used = qual.model_used
        print("✅ Ollama OK.")

    except Exception as exc:
        print(f"\n❌ Ollama error: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        summary = (
            f"The student is classified as '{rf_label}' with "
            f"{round(avg_accuracy * 100)}% accuracy. "
            f"Focus areas: {', '.join(weak_topics)}."
        )
        study_tips = [
            f"Review {weak_topics[0]} using spaced repetition and worked examples.",
            f"Practice {weak_topics[1] if len(weak_topics) > 1 else weak_topics[0]} with timed past-paper questions daily.",
        ]
        model_used = "fallback"

    return AnalyseResponse(
        student_id=request.student_id,
        session_count=session_count,
        rf_label=rf_label,
        avg_accuracy=avg_accuracy,
        moving_avg_latency=moving_avg_latency,
        trend_slope=trend_slope,
        weak_topics=weak_topics,
        topic_accuracies=topic_accuracies,
        summary=summary,
        study_tips=study_tips,
        model_used=model_used,
    )


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)