// src/lib/useAnalyse.ts

import { useState } from "react";
import type { AnalyseRequest, AnalyseResponse, ApiError } from "./types";

interface UseAnalyseReturn {
  analyse: (payload: AnalyseRequest) => Promise<void>;
  data: AnalyseResponse | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useAnalyse(): UseAnalyseReturn {
  const [data, setData]       = useState<AnalyseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const analyse = async (payload: AnalyseRequest) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const apiErr = json as ApiError;
        const msg =
          typeof apiErr.detail === "string"
            ? apiErr.detail
            : apiErr.detail?.[0]?.msg ?? "An unexpected error occurred.";
        setError(msg);
        return;
      }

      setData(json as AnalyseResponse);
    } catch {
      setError("Network error — make sure the FastAPI backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { analyse, data, loading, error, reset };
}