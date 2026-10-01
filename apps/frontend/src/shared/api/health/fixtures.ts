import type { HealthResponse } from "@devtools/core";

export const DEFAULT_HEALTH_FALLBACK: HealthResponse = {
  status: "ok",
  timestamp: "1970-01-01T00:00:00.000Z",
  uptime: 0,
  version: "0.1.0",
};
