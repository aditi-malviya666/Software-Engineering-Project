
export interface Attempt {
  test_session_id: number;
  is_correct: 0 | 1;
  time_taken_seconds: number;
  topic_tag: string;
}
 
export interface AnalyseRequest {
  student_id: number;
  attempts: Attempt[];
}
 
export interface AnalyseResponse {
  student_id: number;
  rf_label: "Needs Improvement" | "Stable" | "Excellent";
  avg_accuracy: number;
  weak_topics: string[];
  summary: string;
  study_tips: string[];
}
 