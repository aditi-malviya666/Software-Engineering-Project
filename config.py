"""
=============================================================================
  config.py — Centralised configuration for Model 2
  Project: Test Conduction and Assessment System (TCAS)
=============================================================================
  All tunable thresholds and settings live here.
  Import anywhere with:  from config import settings
=============================================================================
"""
 
from dataclasses import dataclass, field
 
 
@dataclass(frozen=True)
class AnalysisConfig:
    """
    Thresholds that control how Model 2 classifies performance.
    frozen=True makes the config immutable at runtime.
    """
 
    # ── Topic classification ───────────────────────────────────────────────
    # Accuracy below this → topic is flagged as WEAK
    weak_topic_threshold: float = 0.50
 
    # Accuracy above this → topic is considered STRONG
    strong_topic_threshold: float = 0.80
 
    # ── Time analysis ─────────────────────────────────────────────────────
    # avg_time > global_avg * this multiplier → student is "slow" on that topic
    slow_response_multiplier: float = 1.5
 
    # Questions answered in under this many seconds may indicate guessing
    too_fast_threshold_seconds: float = 5.0
 
    # ── Trend detection ───────────────────────────────────────────────────
    # Accuracy delta (last half vs first half) above this → "improving"
    trend_improve_delta: float = 0.05
 
    # Accuracy delta below negative this → "declining"
    trend_decline_delta: float = 0.05
 
    # Minimum number of test sessions needed to compute a trend
    min_tests_for_trend: int = 2
 
 
@dataclass(frozen=True)
class DatabaseConfig:
    """
    Database connection settings.
    Override via environment variables in production.
    """
    import os as _os
 
    # SQLite path (used in dev / Colab)
    sqlite_path: str = "tcas_model2.db"
 
    # PostgreSQL URL (set in production via environment variable)
    # e.g. postgresql://user:password@localhost:5432/tcas
    postgres_url: str = field(
        default_factory=lambda: __import__("os").getenv(
            "TCAS_DATABASE_URL", ""
        )
    )
 
    # Use PostgreSQL if TCAS_DATABASE_URL is set, else fall back to SQLite
    @property
    def active_url(self) -> str:
        return self.postgres_url if self.postgres_url else f"sqlite:///{self.sqlite_path}"
 
 
@dataclass(frozen=True)
class APIConfig:
    """FastAPI server settings."""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    api_version: str = "v1"
    prefix: str = "/api/v1"
 
 
@dataclass(frozen=True)
class LLMConfig:
    """
    Optional LLM integration settings (Gemini / Claude).
    Keys are read from environment variables — never hardcode them.
    """
    import os as _os
 
    gemini_api_key: str = field(
        default_factory=lambda: __import__("os").getenv("GEMINI_API_KEY", "")
    )
    claude_api_key: str = field(
        default_factory=lambda: __import__("os").getenv("ANTHROPIC_API_KEY", "")
    )
    # Which LLM to use: "gemini" | "claude" | "none"
    provider: str = field(
        default_factory=lambda: __import__("os").getenv("LLM_PROVIDER", "none")
    )
    model_name: str = "gemini-1.5-flash"
    max_tokens: int = 512
 
 
# ── Singleton instances (import these) ────────────────────────────────────
 
analysis  = AnalysisConfig()
database  = DatabaseConfig()
api       = APIConfig()
llm       = LLMConfig()
 
 
# ── Quick sanity-check ─────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== TCAS Model 2 — Active Configuration ===")
    print(f"  Weak topic threshold   : {analysis.weak_topic_threshold * 100:.0f}%")
    print(f"  Strong topic threshold : {analysis.strong_topic_threshold * 100:.0f}%")
    print(f"  Slow response multiplier: {analysis.slow_response_multiplier}×")
    print(f"  Trend improve delta    : +{analysis.trend_improve_delta * 100:.0f}%")
    print(f"  Trend decline delta    : -{analysis.trend_decline_delta * 100:.0f}%")
    print(f"  Min tests for trend    : {analysis.min_tests_for_trend}")
    print(f"  DB URL                 : {database.active_url}")
    print(f"  API prefix             : {api.prefix}")
    print(f"  LLM provider           : {llm.provider}")
 