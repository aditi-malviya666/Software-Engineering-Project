export interface TestAttempt {
  test_session_id:    number;
  is_correct:         0 | 1;
  time_taken_seconds: number;
  topic_tag:          string;
}

export interface AnalyseRequest {
  student_id: number;
  attempts:   TestAttempt[];
}

export interface AnalyseResponse {
  student_id:         number;
  session_count:      number;
  rf_label:           "Needs Improvement" | "Stable" | "Excellent";
  avg_accuracy:       number;
  moving_avg_latency: number;
  trend_slope:        number;
  weak_topics:        string[];
  topic_accuracies:   Record<string, number>;
  summary:            string;
  study_tips:         string[];
  model_used:         string;
}

export interface ApiError {
  detail: { msg: string }[] | string;
}