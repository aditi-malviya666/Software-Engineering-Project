from sqlalchemy import text
from db import engine

def get_results_by_session(session_id):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                session_id,
                time_taken,
                marks_awarded,
                questions_attempted
            FROM results
            WHERE session_id = :session_id
        """), {"session_id": session_id})

        rows = result.fetchall()

        # convert SQLAlchemy rows → normal dict
        return [
            {
                "session_id": row[0],
                "time_taken": row[1],
                "marks_awarded": row[2],
                "questions_attempted": row[3]
            }
            for row in rows
        ]
      
