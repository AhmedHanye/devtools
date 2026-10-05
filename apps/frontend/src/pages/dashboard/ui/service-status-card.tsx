"use client";

import { useIsMounted } from "@/shared/lib";
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
} from "@/shared/ui";
import type { HealthResponse } from "@devtools/core";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import type * as React from "react";

type ServiceStatus = "ok" | "degraded" | "unknown";

interface StatusBadgeConfig {
  variant: "default" | "secondary" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const STATUS_BADGE_CONFIGS: Record<ServiceStatus, StatusBadgeConfig> = {
  ok: {
    variant: "default",
    icon: CheckCircle2,
    label: "Operational",
  },
  degraded: {
    variant: "secondary",
    icon: AlertCircle,
    label: "Degraded",
  },
  unknown: {
    variant: "outline",
    icon: Activity,
    label: "Unknown",
  },
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = STATUS_BADGE_CONFIGS[status] ?? STATUS_BADGE_CONFIGS.unknown;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}

function formatTimestamp(
  timestamp: string | null | undefined,
  mounted: boolean,
): string {
  if (!mounted || !timestamp) {
    return "--:--:--";
  }
  const match = timestamp.match(/T(\d{2}:\d{2}:\d{2})/);
  if (match) {
    return `${match[1]} UTC`;
  }
  return "--:--:--";
}

export interface ServiceStatusCardProps {
  name: string;
  data: HealthResponse;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ServiceStatusCard({
  name,
  data,
  onRefresh,
  isRefreshing = false,
}: ServiceStatusCardProps) {
  const mounted = useIsMounted();
  const status: ServiceStatus = (data.status as ServiceStatus) ?? "unknown";

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {data.version ? `v${data.version}` : "Runtime Daemon"}
        </CardDescription>
        <CardAction>
          <StatusBadge status={status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>Uptime:</span>
            <span className="text-foreground font-mono font-medium">
              {`${Math.round(data.uptime ?? 0)}s`}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Activity className="size-3.5" />
            <span>Last Checked:</span>
            <span className="text-foreground font-mono">
              {formatTimestamp(data.timestamp, mounted)}
            </span>
          </div>
        </div>
      </CardContent>
      {onRefresh && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={
                isRefreshing ? "me-1.5 size-3 animate-spin" : "me-1.5 size-3"
              }
            />
            Refresh Status
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
