"use client";

import { fetchServiceHealth } from "@/shared/api";
import type { HealthResponse } from "@devtools/core";
import { useCallback, useEffect, useState } from "react";

export type ServiceHealthStatus = "idle" | "loading" | "success" | "error";

export interface UseServiceHealthOptions {
  endpoint?: string;
  pollingInterval?: number;
  initialData?: HealthResponse | null;
  autoFetch?: boolean;
  fetchFn?: (options?: {
    endpoint?: string;
    signal?: AbortSignal;
  }) => Promise<HealthResponse>;
}

export interface UseServiceHealthResult {
  status: ServiceHealthStatus;
  data: HealthResponse | null;
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
    initialData = null,
    autoFetch = true,
    fetchFn = fetchServiceHealth,
  } = options;

  const [status, setStatus] = useState<ServiceHealthStatus>(() =>
    initialData ? "success" : autoFetch ? "loading" : "idle",
  );
  const [data, setData] = useState<HealthResponse | null>(initialData);
  const [error, setError] = useState<Error | null>(null);

  const executeFetch = useCallback(
    async (signalOrEvent?: unknown) => {
      const signal =
        signalOrEvent instanceof AbortSignal ? signalOrEvent : undefined;

      setStatus("loading");
      try {
        const result = await fetchFn({ endpoint, signal });
        setData(result);
        setError(null);
        setStatus("success");
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [endpoint, fetchFn],
  );

  const refresh = useCallback(async () => {
    await executeFetch();
  }, [executeFetch]);

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
    status,
    data,
    error,
    refresh,
    isPolling: pollingInterval > 0 && autoFetch,
  };
}
