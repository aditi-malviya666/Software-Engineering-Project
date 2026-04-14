'use client'

import { useEffect, useState } from 'react'

export default function AnalysisPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      const res = await fetch('http://127.0.0.1:8000/api/v1/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: 42,
          attempts: [
            { test_session_id: 1, is_correct: 0, time_taken_seconds: 72, topic_tag: "Optics" },
            { test_session_id: 1, is_correct: 1, time_taken_seconds: 55, topic_tag: "Calculus" },
            { test_session_id: 2, is_correct: 0, time_taken_seconds: 80, topic_tag: "Optics" },
            { test_session_id: 2, is_correct: 1, time_taken_seconds: 44, topic_tag: "Thermodynamics" },
            { test_session_id: 3, is_correct: 1, time_taken_seconds: 40, topic_tag: "Calculus" },
            { test_session_id: 3, is_correct: 0, time_taken_seconds: 65, topic_tag: "Optics" }
          ]
        })
      })

      const result = await res.json()
      setData(result)
    }

    fetchAnalysis()
  }, [])

  if (!data) return <p>Loading analysis...</p>

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Performance Analysis</h1>

      <h2>Status: {data.rf_label}</h2>
      <p>Accuracy: {data.avg_accuracy}</p>

      <h3>Weak Topics:</h3>
      <ul>
        {data.weak_topics.map((topic: string, i: number) => (
          <li key={i}>{topic}</li>
        ))}
      </ul>

      <h3>Summary:</h3>
      <p>{data.summary}</p>

      <h3>Study Tips:</h3>
      <ul>
        {data.study_tips.map((tip: string, i: number) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}