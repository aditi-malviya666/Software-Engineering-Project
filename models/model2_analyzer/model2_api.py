"""
model2_api.py — TCAS Model 2 API ( Keshav)
──────────────────────────────────────────────────────────
Stats engine  : model2_performance_analyzer.py  
RF + Ollama   : model2_bridge.py                (Keshav)
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Any
import json

from model2_performance_analyzer import analyze, PerformanceAnalyzer
from model2_bridge import rf_analyze  # ← Keshav's RF + Ollama

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="TCAS Model 2 API (Merged)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class QuestionRecord(BaseModel):
    topic:      str   = Field(..., example="Thermodynamics")
    is_correct: int   = Field(..., ge=0, le=1)
    time_taken: float = Field(..., ge=0)
    test_id:    int   = Field(..., example=1)

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("topic must not be empty")
        return v.strip()


class AnalyzeRequest(BaseModel):
    records:    list[QuestionRecord] = Field(..., min_length=1)
    student_id: int                  = Field(default=0)  # optional, used by Ollama


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "TCAS Model 2 API (Merged) is running ",
        "docs": "/docs",
        "version": "2.0.0 — Stats  + RF/Ollama "
    }


@app.get("/health")
def health_check():
    from model2_bridge import RF_PIPELINE
    return {
        "status": "ok",
        "rf_model_loaded": RF_PIPELINE is not None,
    }


@app.post("/analyze")
def analyze_full(request: AnalyzeRequest) -> dict[str, Any]:
    """
    Full merged analysis:
    - Statistical breakdown (Vishal's engine)
    - RF label + Ollama coaching (Keshav's engine)
    """
    try:
        records = [r.model_dump() for r in request.records]

        # ── Vishal's stats engine ──────────────────────────────────────────
        stats_result = analyze(records)

        # ── Keshav's RF + Ollama engine ────────────────────────────────────
        rf_result = rf_analyze(records, student_id=request.student_id)

        # ── Merge both results ─────────────────────────────────────────────
        return {
            # Stats (Vishal)
            "json_report":   stats_result["json_report"],
            "text_summary":  stats_result["text_summary"],

            # RF + Ollama (Keshav)
            "rf_label":           rf_result["rf_label"],
            "rf_available":       rf_result["rf_available"],
            "avg_accuracy":       rf_result["avg_accuracy"],
            "moving_avg_latency": rf_result["moving_avg_latency"],
            "trend_slope":        rf_result["trend_slope"],
            "weak_topics":        rf_result["weak_topics"],
            "topic_accuracies":   rf_result["topic_accuracies"],
            "summary":            rf_result["summary"],
            "study_tips":         rf_result["study_tips"],
            "model_used":         rf_result["model_used"],
            "session_count":      rf_result["session_count"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze/json")
def analyze_json(request: AnalyzeRequest):
    """Stats-only JSON report (Vishal's engine)."""
    try:
        records = [r.model_dump() for r in request.records]
        analyzer = PerformanceAnalyzer(records)
        return json.loads(analyzer.get_json_report())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/summary", response_class=PlainTextResponse)
def analyze_summary(request: AnalyzeRequest):
    """Stats-only text summary (Vishal's engine)."""
    try:
        records = [r.model_dump() for r in request.records]
        analyzer = PerformanceAnalyzer(records)
        return analyzer.get_text_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/rf")
def analyze_rf(request: AnalyzeRequest):
    """RF + Ollama only (Keshav's engine)."""
    try:
        records = [r.model_dump() for r in request.records]
        return rf_analyze(records, student_id=request.student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
