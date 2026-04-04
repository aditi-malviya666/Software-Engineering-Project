from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field, field_validator
from typing import Any, List
import json
from fastapi.middleware.cors import CORSMiddleware

# Import core analyser
# Ensure these files are in the same directory as this script
from model2_performance_analyzer import analyze, PerformanceAnalyzer

# 1. Initialize App First
app = FastAPI(
    title="TCAS Model 2 API",
    version="1.0.0"
)

# 2. Add Middleware after initialization
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Pydantic Models --------------------

class QuestionRecord(BaseModel):
    topic: str = Field(..., json_schema_extra={"example": "Thermodynamics"})
    is_correct: int = Field(..., ge=0, le=1, json_schema_extra={"example": 1})
    time_taken: float = Field(..., ge=0, json_schema_extra={"example": 45.0})
    test_id: int = Field(..., json_schema_extra={"example": 1})

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("topic must not be empty")
        return v.strip()


class AnalyzeRequest(BaseModel):
    records: List[QuestionRecord] = Field(..., min_length=1)


# -------------------- Routes --------------------

@app.get("/")
def root():
    return {
        "message": "TCAS Model 2 API is running 🚀",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/analyze")
def analyze_full(request: AnalyzeRequest) -> dict[str, Any]:
    try:
        # model_dump() is correct for Pydantic v2
        records = [r.model_dump() for r in request.records]
        return analyze(records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/json")
def analyze_json(request: AnalyzeRequest):
    try:
        records = [r.model_dump() for r in request.records]
        analyzer = PerformanceAnalyzer(records)
        # Assuming get_json_report returns a JSON string
        return json.loads(analyzer.get_json_report())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/summary", response_class=PlainTextResponse)
def analyze_summary(request: AnalyzeRequest):
    try:
        records = [r.model_dump() for r in request.records]
        analyzer = PerformanceAnalyzer(records)
        return analyzer.get_text_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))