"use client";

import { DEFAULT_HEALTH_FALLBACK, fetchServiceHealth } from "@/shared/api";
import type { HealthResponse } from "@devtools/core";
import { useCallback, useEffect, useState } from "react";

export interface UseServiceHealthOptions {
  endpoint?: string;
  pollingInterval?: number;
  initialData?: HealthResponse;
  autoFetch?: boolean;
  fetchFn?: (options?: {
    endpoint?: string;
    signal?: AbortSignal;
  }) => Promise<HealthResponse>;
}

export interface UseServiceHealthResult {
  data: HealthResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isPolling: boolean;
}

export function useServiceHealth(
  options: UseServiceHealthOptions = {},
): UseServiceHealthResult {
  const {
    endpoint = "/api/health",
    pollingInterval = 0,
    initialData = DEFAULT_HEALTH_FALLBACK,
    autoFetch = true,
    fetchFn = fetchServiceHealth,
  } = options;

  const [data, setData] = useState<HealthResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const result = await fetchFn({ endpoint, signal });
        setData(result);
        setError(null);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, fetchFn],
  );

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    let activeController: AbortController | null = new AbortController();
    void executeFetch(activeController.signal);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (pollingInterval > 0) {
      intervalId = setInterval(() => {
        activeController?.abort();
        activeController = new AbortController();
        void executeFetch(activeController.signal);
      }, pollingInterval);
    }

    return () => {
      activeController?.abort();
      activeController = null;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoFetch, executeFetch, pollingInterval]);

  return {
    data,
    isLoading,
    error,
    refresh: executeFetch,
    isPolling: pollingInterval > 0 && autoFetch,
  };
}
