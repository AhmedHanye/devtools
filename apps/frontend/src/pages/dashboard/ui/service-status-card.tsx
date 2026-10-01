import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/shared/ui";
import { useIsMounted } from "@/shared/lib";
import type { HealthResponse } from "@devtools/core";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import * as React from "react";

export interface ServiceStatusCardProps {
  name: string;
  data: HealthResponse | null;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

type ServiceStatus = "ok" | "degraded" | "error" | "unreachable" | "unknown";

function renderStatusBadge(status: ServiceStatus) {
  switch (status) {
    case "ok":
      return (
        <Badge variant="default">
          <CheckCircle2 className="size-3.5" />
          Operational
        </Badge>
      );
    case "degraded":
      return (
        <Badge variant="secondary">
          <AlertCircle className="size-3.5" />
          Degraded
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive">
          <ShieldAlert className="size-3.5" />
          Error
        </Badge>
      );
    case "unreachable":
      return (
        <Badge variant="destructive">
          <AlertCircle className="size-3.5" />
          Unreachable
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Activity className="size-3.5" />
          Unknown
        </Badge>
      );
  }
}

function formatTimestamp(
  timestamp: string | null | undefined,
  mounted: boolean,
): string {
  if (!mounted || !timestamp) {
    return "--:--:--";
  }
  return new Date(timestamp).toLocaleTimeString();
}

export function ServiceStatusCard({
  name,
  data,
  isLoading = false,
  error = null,
  onRefresh,
}: ServiceStatusCardProps) {
  const mounted = useIsMounted();

  const status: ServiceStatus = error
    ? "unreachable"
    : ((data?.status as ServiceStatus) ?? "unknown");

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {data?.version ? `v${data.version}` : "Runtime Daemon"}
        </CardDescription>
        <CardAction>{renderStatusBadge(status)}</CardAction>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs">
            <p className="font-semibold">Service Unreachable</p>
            <p className="mt-1 font-mono break-all">{error.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Uptime:</span>
              <span className="text-foreground font-mono font-medium">
                {isLoading && !data ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  `${Math.round(data?.uptime ?? 0)}s`
                )}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="size-3.5" />
              <span>Last Checked:</span>
              <span className="text-foreground font-mono">
                {formatTimestamp(data?.timestamp, mounted)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      {onRefresh && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={
                isLoading ? "mr-1.5 size-3 animate-spin" : "mr-1.5 size-3"
              }
            />
            Refresh Status
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
