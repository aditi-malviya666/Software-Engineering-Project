"""
qualitative_engine.py
─────────────────────
Qualitative inference module (REQ-4.2).
 
Takes the Random Forest classification label and the student's top-3
weak topic tags and queries a locally running Ollama instance (llama3)
to produce:
  • A 2-sentence professional performance summary.
  • Two specific, actionable study recommendations.
 
All output is returned as a validated, strict JSON object suitable for
direct consumption by a Next.js frontend.
"""
 
from __future__ import annotations
 
import json
import re
import textwrap
from dataclasses import dataclass, field
from typing import Any
 
import httpx
 
 
# ── Configuration ─────────────────────────────────────────────────────────────
 
OLLAMA_BASE_URL: str = "http://localhost:11434"
OLLAMA_MODEL: str = "llama3.2:1b"
REQUEST_TIMEOUT: float = 60.0          # seconds
 
VALID_LABELS: frozenset[str] = frozenset(
    {"Needs Improvement", "Stable", "Excellent"}
)
 
 
# ── Data Contracts ────────────────────────────────────────────────────────────
 
@dataclass(frozen=True)
class QualitativeInput:
    """
    Validated input bundle for the qualitative inference function.
 
    Attributes
    ----------
    rf_label : str
        Classification label produced by the Random Forest model.
        Must be one of: "Needs Improvement", "Stable", "Excellent".
    weak_topics : list[str]
        Ordered list of the student's top-3 weakest topic tags (by accuracy).
    student_id : int
        Unique identifier for the student, used for traceability.
    avg_accuracy : float
        Student's overall average accuracy (0.0 – 1.0).
    """
    rf_label: str
    weak_topics: list[str]
    student_id: int
    avg_accuracy: float
 
    def __post_init__(self) -> None:
        if self.rf_label not in VALID_LABELS:
            raise ValueError(
                f"rf_label must be one of {sorted(VALID_LABELS)}, "
                f"got '{self.rf_label}'."
            )
        if not (1 <= len(self.weak_topics) <= 3):
            raise ValueError("weak_topics must contain 1–3 items.")
        if not (0.0 <= self.avg_accuracy <= 1.0):
            raise ValueError("avg_accuracy must be in [0.0, 1.0].")
 
 
@dataclass
class QualitativeOutput:
    """
    Structured qualitative analysis returned to the frontend.
 
    Attributes
    ----------
    student_id : int
    rf_label : str
    summary : str
        Two-sentence professional performance summary.
    study_tips : list[str]
        Exactly two specific, actionable study recommendations.
    weak_topics : list[str]
    model_used : str
    """
    student_id: int
    rf_label: str
    summary: str
    study_tips: list[str]
    weak_topics: list[str]
    model_used: str = field(default=OLLAMA_MODEL)
 
    def to_json(self) -> str:
        """Serialise to a strict JSON string for API responses."""
        return json.dumps(self.__dict__, ensure_ascii=False, indent=2)
 
 
# ── Prompt Construction ───────────────────────────────────────────────────────
 
def _build_prompt(payload: QualitativeInput) -> str:
    """
    Construct a structured, professional prompt for Ollama.
 
    The prompt enforces strict JSON output so the response can be
    parsed deterministically without heuristics.
 
    Parameters
    ----------
    payload : QualitativeInput
        Validated input data for the student.
 
    Returns
    -------
    str
        Complete prompt string ready to send to the Ollama API.
    """
    topics_str: str = ", ".join(payload.weak_topics)
    accuracy_pct: str = f"{payload.avg_accuracy * 100:.1f}%"
 
    return textwrap.dedent(f"""
        You are an expert academic advisor specialising in TCAS (Thai University
        Central Admission System) examination preparation.
 
        A student (ID: {payload.student_id}) has been assessed by a machine-learning
        performance model with the following findings:
 
          Performance Classification : {payload.rf_label}
          Overall Average Accuracy   : {accuracy_pct}
          Primary Weak Topic Areas   : {topics_str}
 
        Your task is to produce a concise, professional academic report in the
        following STRICT JSON format. Output ONLY valid JSON — no markdown fences,
        no preamble, no trailing commentary.
 
        {{
          "summary": "<Exactly two sentences. First sentence: state the overall
                       performance level professionally. Second sentence: connect
                       the weak topics to the performance classification.>",
          "study_tips": [
            "<Specific, actionable study recommendation for the first weak topic.>",
            "<Specific, actionable study recommendation for the second weak topic
               or a cross-cutting strategy if only one weak topic exists.>"
          ]
        }}
 
        Constraints:
        - Maintain an academic, encouraging, and professional tone throughout.
        - Each study tip must reference concrete study methods (e.g., spaced
          repetition, worked examples, concept mapping) rather than generic advice.
        - Do not exceed 60 words per field.
        - Output must be valid, parseable JSON with no additional keys.
    """).strip()
 
 
# ── Ollama Communication ──────────────────────────────────────────────────────
 
def _query_ollama(prompt: str) -> str:
    """
    Send *prompt* to the locally running Ollama instance and return the
    raw text response.
 
    Parameters
    ----------
    prompt : str
        The fully constructed prompt string.
 
    Returns
    -------
    str
        Raw string response from the model.
 
    Raises
    ------
    httpx.ConnectError
        If Ollama is not reachable at OLLAMA_BASE_URL.
    httpx.TimeoutException
        If the request exceeds REQUEST_TIMEOUT seconds.
    """
    payload: dict[str, Any] = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,       # low temp → deterministic, professional output
            "top_p": 0.9,
            "num_predict": 300,
        },
    }
 
    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        response = client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
        )
        response.raise_for_status()
        return response.json()["response"]
 
 
def _extract_json(raw: str) -> dict[str, Any]:
    """
    Parse and validate the JSON object embedded in *raw*.
 
    Strips any accidental markdown fences and extracts the first
    well-formed JSON object found in the string.
 
    Parameters
    ----------
    raw : str
        Raw string from the Ollama response.
 
    Returns
    -------
    dict[str, Any]
        Parsed dictionary with keys "summary" and "study_tips".
 
    Raises
    ------
    ValueError
        If no valid JSON object can be extracted or required keys are missing.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
 
    # Extract first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in Ollama response:\n{raw[:500]}")
 
    try:
        data: dict[str, Any] = json.loads(match.group())
    except json.JSONDecodeError as exc:
        raise ValueError(f"Malformed JSON from Ollama: {exc}\nRaw: {raw[:500]}") from exc
 
    required_keys: set[str] = {"summary", "study_tips"}
    missing = required_keys - data.keys()
    if missing:
        raise ValueError(f"Ollama response missing required keys: {missing}")
 
    if not isinstance(data["study_tips"], list) or len(data["study_tips"]) < 2:
        raise ValueError("'study_tips' must be a list with at least 2 items.")
 
    return data
 
 
# ── Public Inference Function ─────────────────────────────────────────────────
 
def generate_qualitative_analysis(payload: QualitativeInput) -> QualitativeOutput:
    """
    Primary public interface for the qualitative module (REQ-4.2).
 
    Constructs a professional Ollama prompt from the Random Forest label
    and weak topic tags, queries the local llama3 model, and returns a
    validated QualitativeOutput object.
 
    Parameters
    ----------
    payload : QualitativeInput
        Validated student assessment data.
 
    Returns
    -------
    QualitativeOutput
        Structured qualitative report ready for JSON serialisation.
 
    Raises
    ------
    httpx.ConnectError
        If the Ollama service is not running locally.
    ValueError
        If the model response cannot be parsed into the expected schema.
 
    Example
    -------
    >>> inp = QualitativeInput(
    ...     rf_label="Needs Improvement",
    ...     weak_topics=["Optics", "Thermodynamics", "Calculus"],
    ...     student_id=42,
    ...     avg_accuracy=0.38,
    ... )
    >>> out = generate_qualitative_analysis(inp)
    >>> print(out.to_json())
    """
    prompt: str = _build_prompt(payload)
    raw_response: str = _query_ollama(prompt)
    parsed: dict[str, Any] = _extract_json(raw_response)
 
    return QualitativeOutput(
        student_id=payload.student_id,
        rf_label=payload.rf_label,
        summary=parsed["summary"],
        study_tips=parsed["study_tips"][:2],   # enforce exactly 2 tips
        weak_topics=payload.weak_topics,
        model_used=OLLAMA_MODEL,
    )
 
