"use client";

import { useEffect, useState, useCallback } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  url: string,
  intervalMs?: number
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || "Unknown error");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    if (intervalMs) {
      const id = setInterval(fetchData, intervalMs);
      return () => clearInterval(id);
    }
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}
