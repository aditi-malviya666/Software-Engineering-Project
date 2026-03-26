"""
=============================================================================
  database.py — Persistence layer for Model 2
  Project: Test Conduction and Assessment System (TCAS)
=============================================================================
  Uses SQLite by default (zero setup — works in Colab instantly).
  Swap to PostgreSQL in production by setting the TCAS_DATABASE_URL
  environment variable (see config.py).
 
  Tables:
    students          — one row per student
    analysis_reports  — one report per analysis run (JSON blob + metadata)
    topic_stats       — per-topic rows linked to a report (queryable)
 
  Usage:
    from database import Database
    db = Database()
    db.init()
 
    report_id = db.save_report(student_id="stu_01", records=records, result=result)
    history   = db.get_student_history("stu_01")
    report    = db.get_report(report_id)
=============================================================================
"""
 
from __future__ import annotations
 
import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any
 
from config import database as db_config
 
 
# ============================================================================
# Database class
# ============================================================================
 
class Database:
    """
    Thin SQLite wrapper for Model 2.
    All public methods open + close their own connection so the class
    is safe to use in multi-threaded / async contexts.
    """
 
    def __init__(self, db_path: str | None = None) -> None:
        # Allow override for testing (pass ":memory:" for in-memory DB)
        self._path = db_path or db_config.sqlite_path
 
    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------
 
    def init(self) -> None:
        """Create all tables if they don't already exist."""
        with self._connect() as conn:
            conn.executescript("""
                -- Students master table
                CREATE TABLE IF NOT EXISTS students (
                    student_id   TEXT PRIMARY KEY,
                    name         TEXT,
                    created_at   TEXT NOT NULL
                );
 
                -- One row per analysis run
                CREATE TABLE IF NOT EXISTS analysis_reports (
                    report_id        TEXT PRIMARY KEY,
                    student_id       TEXT NOT NULL,
                    created_at       TEXT NOT NULL,
                    total_questions  INTEGER NOT NULL,
                    total_tests      INTEGER NOT NULL,
                    overall_accuracy REAL NOT NULL,
                    trend_direction  TEXT NOT NULL,
                    weak_topics_json TEXT NOT NULL,   -- JSON array
                    tips_json        TEXT NOT NULL,   -- JSON array
                    full_report_json TEXT NOT NULL,   -- complete JSON blob
                    raw_records_json TEXT NOT NULL    -- original input records
                );
 
                -- Per-topic rows for easy querying without parsing JSON
                CREATE TABLE IF NOT EXISTS topic_stats (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_id        TEXT NOT NULL,
                    student_id       TEXT NOT NULL,
                    topic            TEXT NOT NULL,
                    total_questions  INTEGER NOT NULL,
                    correct          INTEGER NOT NULL,
                    incorrect        INTEGER NOT NULL,
                    accuracy         REAL NOT NULL,
                    avg_time_seconds REAL NOT NULL,
                    is_weak          INTEGER NOT NULL,  -- 0 or 1
                    created_at       TEXT NOT NULL,
                    FOREIGN KEY (report_id) REFERENCES analysis_reports(report_id)
                );
 
                -- Index for fast student history lookups
                CREATE INDEX IF NOT EXISTS idx_reports_student
                    ON analysis_reports(student_id, created_at);
 
                CREATE INDEX IF NOT EXISTS idx_topic_stats_student
                    ON topic_stats(student_id, topic);
            """)
        print(f"[DB] Initialised — {self._path}")
 
    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------
 
    def save_report(
        self,
        student_id: str,
        records: list[dict[str, Any]],
        result: dict[str, Any],          # output of analyze()
        student_name: str | None = None,
    ) -> str:
        """
        Persist one analysis run.
 
        Parameters
        ----------
        student_id   : unique identifier for the student
        records      : raw input records passed to analyze()
        result       : dict returned by analyze()  {json_report, text_summary}
        student_name : optional display name
 
        Returns
        -------
        report_id : UUID string for the saved report
        """
        report_id  = str(uuid.uuid4())
        now        = datetime.utcnow().isoformat()
        json_report = result["json_report"]
 
        with self._connect() as conn:
            # Upsert student
            conn.execute("""
                INSERT INTO students (student_id, name, created_at)
                VALUES (?, ?, ?)
                ON CONFLICT(student_id) DO UPDATE SET name = excluded.name
            """, (student_id, student_name or student_id, now))
 
            # Insert report
            conn.execute("""
                INSERT INTO analysis_reports (
                    report_id, student_id, created_at,
                    total_questions, total_tests, overall_accuracy,
                    trend_direction, weak_topics_json, tips_json,
                    full_report_json, raw_records_json
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (
                report_id,
                student_id,
                now,
                json_report["total_questions"],
                json_report["total_tests"],
                json_report["overall_accuracy"],
                json_report["trend_direction"],
                json.dumps(json_report["weak_topics"]),
                json.dumps(json_report["improvement_tips"]),
                json.dumps(json_report),
                json.dumps(records),
            ))
 
            # Insert per-topic rows
            for t in json_report.get("topic_stats", []):
                conn.execute("""
                    INSERT INTO topic_stats (
                        report_id, student_id, topic,
                        total_questions, correct, incorrect,
                        accuracy, avg_time_seconds, is_weak, created_at
                    ) VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (
                    report_id, student_id, t["topic"],
                    t["total_questions"], t["correct"], t["incorrect"],
                    t["accuracy"], t["avg_time_seconds"],
                    1 if t["is_weak"] else 0, now,
                ))
 
        print(f"[DB] Report saved — id={report_id}, student={student_id}")
        return report_id
 
    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------
 
    def get_report(self, report_id: str) -> dict[str, Any] | None:
        """Fetch a single report by its ID. Returns None if not found."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT full_report_json, created_at FROM analysis_reports WHERE report_id = ?",
                (report_id,)
            ).fetchone()
 
        if not row:
            return None
        return {
            "report_id":  report_id,
            "created_at": row["created_at"],
            **json.loads(row["full_report_json"]),
        }
 
    def get_student_history(
        self,
        student_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Return the most recent `limit` reports for a student,
        newest first.  Returns lightweight summaries (not full JSON).
        """
        with self._connect() as conn:
            rows = conn.execute("""
                SELECT report_id, created_at, total_questions,
                       total_tests, overall_accuracy, trend_direction,
                       weak_topics_json
                FROM analysis_reports
                WHERE student_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (student_id, limit)).fetchall()
 
        return [
            {
                "report_id":        r["report_id"],
                "created_at":       r["created_at"],
                "total_questions":  r["total_questions"],
                "total_tests":      r["total_tests"],
                "overall_accuracy": r["overall_accuracy"],
                "trend_direction":  r["trend_direction"],
                "weak_topics":      json.loads(r["weak_topics_json"]),
            }
            for r in rows
        ]
 
    def get_weak_topics_summary(self, student_id: str) -> list[dict[str, Any]]:
        """
        Aggregate topic performance across ALL reports for a student.
        Useful for showing long-term weak areas.
        """
        with self._connect() as conn:
            rows = conn.execute("""
                SELECT
                    topic,
                    COUNT(*)            AS appearances,
                    AVG(accuracy)       AS avg_accuracy,
                    AVG(avg_time_seconds) AS avg_time,
                    SUM(correct)        AS total_correct,
                    SUM(total_questions) AS total_questions
                FROM topic_stats
                WHERE student_id = ?
                GROUP BY topic
                ORDER BY avg_accuracy ASC
            """, (student_id,)).fetchall()
 
        return [
            {
                "topic":           r["topic"],
                "appearances":     r["appearances"],
                "avg_accuracy":    round(r["avg_accuracy"], 4),
                "avg_time":        round(r["avg_time"], 2),
                "total_correct":   r["total_correct"],
                "total_questions": r["total_questions"],
            }
            for r in rows
        ]
 
    def get_all_students(self) -> list[dict[str, Any]]:
        """Return all registered students."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT student_id, name, created_at FROM students ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]
 
    def delete_report(self, report_id: str) -> bool:
        """Delete a report and its topic_stats rows. Returns True if deleted."""
        with self._connect() as conn:
            conn.execute("DELETE FROM topic_stats       WHERE report_id = ?", (report_id,))
            cur = conn.execute(
                "DELETE FROM analysis_reports WHERE report_id = ?", (report_id,)
            )
        return cur.rowcount > 0
 
    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
 
    def _connect(self) -> sqlite3.Connection:
        """Open a connection with row_factory set to Row for dict-like access."""
        conn = sqlite3.connect(self._path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")   # better concurrency
        conn.execute("PRAGMA foreign_keys=ON")
        return conn
 
 
# ============================================================================
# Quick demo  (python database.py)
# ============================================================================
 
if __name__ == "__main__":
    from model2_performance_analyzer import analyze
 
    # Use an in-memory DB so nothing is written to disk during the demo
    db = Database(db_path=":memory:")
    db.init()
 
    sample_records = [
        {"topic": "Thermodynamics", "is_correct": 0, "time_taken": 60, "test_id": 1},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 40, "test_id": 1},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 55, "test_id": 1},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 90, "test_id": 2},
        {"topic": "Optics",         "is_correct": 0, "time_taken": 85, "test_id": 2},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 50, "test_id": 2},
        {"topic": "Thermodynamics", "is_correct": 1, "time_taken": 45, "test_id": 3},
        {"topic": "Calculus",       "is_correct": 1, "time_taken": 40, "test_id": 3},
    ]
 
    result = analyze(sample_records)
 
    # Save report
    rid = db.save_report(
        student_id="stu_001",
        student_name="Aryan Sharma",
        records=sample_records,
        result=result,
    )
 
    # Fetch it back
    report = db.get_report(rid)
    print(f"\n[GET REPORT] overall_accuracy = {report['overall_accuracy']}")
 
    # Student history
    history = db.get_student_history("stu_001")
    print(f"[HISTORY]    {len(history)} report(s) found")
 
    # Weak topics summary
    weak = db.get_weak_topics_summary("stu_001")
    print(f"[WEAK TOPICS SUMMARY]")
    for w in weak:
        print(f"  {w['topic']:<20} avg accuracy = {w['avg_accuracy']*100:.1f}%")
 