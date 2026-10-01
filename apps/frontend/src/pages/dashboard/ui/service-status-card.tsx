import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/shared/ui";
import type { HealthResponse } from "@devtools/core";
import { Activity, AlertCircle, CheckCircle2, Clock, RefreshCw, ShieldAlert } from "lucide-react";
import * as React from "react";

export interface ServiceStatusCardProps {
  name: string;
  data: HealthResponse | null;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export function ServiceStatusCard({
  name,
  data,
  isLoading = false,
  error = null,
  onRefresh,
}: ServiceStatusCardProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const status = error ? "unreachable" : (data?.status ?? "unknown");

  const getStatusBadge = () => {
    switch (status) {
      case "ok":
        return (
          <Badge variant="success" className="gap-1.5 font-medium">
            <CheckCircle2 className="size-3.5" />
            Operational
          </Badge>
        );
      case "degraded":
        return (
          <Badge variant="warning" className="gap-1.5 font-medium">
            <AlertCircle className="size-3.5" />
            Degraded
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1.5 font-medium">
            <ShieldAlert className="size-3.5" />
            Error
          </Badge>
        );
      case "unreachable":
        return (
          <Badge variant="destructive" className="gap-1.5 font-medium">
            <AlertCircle className="size-3.5" />
            Unreachable
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1.5 font-medium">
            <Activity className="size-3.5" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <Card className="flex flex-col justify-between border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <CardDescription className="text-xs">
            {data?.version ? `v${data.version}` : "Runtime Daemon"}
          </CardDescription>
        </div>
        <div>{getStatusBadge()}</div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            <p className="font-semibold">Service Unreachable</p>
            <p className="mt-1 font-mono text-[11px] break-all">{error.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" />
              <span>Uptime:</span>
              <span className="font-mono font-medium text-foreground">
                {isLoading && !data ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  `${Math.round(data?.uptime ?? 0)}s`
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="size-3.5" />
              <span>Last Checked:</span>
              <span className="font-mono text-[11px] text-foreground">
                {mounted && data?.timestamp
                  ? new Date(data.timestamp).toLocaleTimeString()
                  : "--:--:--"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      {onRefresh && (
        <CardFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
