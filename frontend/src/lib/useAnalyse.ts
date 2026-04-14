// src/lib/useAnalyse.ts

// import { useState } from "react";
// import type { AnalyseRequest, AnalyseResponse, ApiError } from "./types";

// interface UseAnalyseReturn {
//   analyse: (payload: AnalyseRequest) => Promise<void>;
//   data: AnalyseResponse | null;
//   loading: boolean;
//   error: string | null;
//   reset: () => void;
// }

// export function useAnalyse(): UseAnalyseReturn {
//   const [data, setData]       = useState<AnalyseResponse | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError]     = useState<string | null>(null);

//   const analyse = async (payload: AnalyseRequest) => {
//     setLoading(true);
//     setError(null);
//     setData(null);

//     try {
//       const res = await fetch("/api/analyse", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify(payload),
//       });

//       const json = await res.json();

//       if (!res.ok) {
//         const apiErr = json as ApiError;
//         const msg =
//           typeof apiErr.detail === "string"
//             ? apiErr.detail
//             : apiErr.detail?.[0]?.msg ?? "An unexpected error occurred.";
//         setError(msg);
//         return;
//       }

//       setData(json as AnalyseResponse);
//     } catch {
//       setError("Network error — make sure the FastAPI backend is running on port 8000.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const reset = () => {
//     setData(null);
//     setError(null);
//   };

//   return { analyse, data, loading, error, reset };
// }
import { useState } from "react";
import type { TestAttempt } from "./types";

const API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

export function useAnalyse() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = async (payload: {
    student_id: number;
    attempts: TestAttempt[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/analyse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to analyse");
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setData(null);

  return { analyse, data, loading, error, reset };
}