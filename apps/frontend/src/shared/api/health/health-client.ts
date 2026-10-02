import { type HealthResponse, HealthResponseSchema } from "@devtools/core";

export const DEFAULT_HEALTH_FALLBACK: HealthResponse = {
  status: "ok",
  timestamp: "1970-01-01T00:00:00.000Z",
  uptime: 0,
  version: "0.1.0",
};

export interface FetchHealthOptions {
  endpoint?: string;
  fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  signal?: AbortSignal;
}

export async function fetchServiceHealth(
  options: FetchHealthOptions = {},
): Promise<HealthResponse> {
  const endpoint = options.endpoint ?? "/api/health";
  const fetcher = options.fetchFn ?? fetch;

  const res = await fetcher(endpoint, {
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Health check request failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  return HealthResponseSchema.parse(data);
}
