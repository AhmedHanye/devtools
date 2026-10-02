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
  Skeleton,
} from "@/shared/ui";
import type { HealthResponse } from "@devtools/core";
import {
  Activity,
  AlertCircle,
  Box,
  CheckCircle2,
  Clock,
  Layers,
  LayoutDashboard,
  Radio,
  RefreshCw,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import type * as React from "react";
import { useServiceHealth } from "../model";

type ServiceStatus = "ok" | "degraded" | "error" | "unreachable" | "unknown";

interface StatusBadgeConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
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
  error: {
    variant: "destructive",
    icon: ShieldAlert,
    label: "Error",
  },
  unreachable: {
    variant: "destructive",
    icon: AlertCircle,
    label: "Unreachable",
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
  return new Date(timestamp).toLocaleTimeString();
}

interface ServiceStatusCardProps {
  name: string;
  data: HealthResponse | null;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

function ServiceStatusCard({
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
          {isLoading && !data ? (
            <Skeleton className="h-4 w-24" />
          ) : data?.version ? (
            `v${data.version}`
          ) : (
            "Runtime Daemon"
          )}
        </CardDescription>
        <CardAction>
          {isLoading && !data ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <StatusBadge status={status} />
          )}
        </CardAction>
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
                {isLoading && !data ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  formatTimestamp(data?.timestamp, mounted)
                )}
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
                isLoading ? "me-1.5 size-3 animate-spin" : "me-1.5 size-3"
              }
            />
            Refresh Status
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

interface DashboardShellProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

function DashboardShell({
  title = "DevTools System Dashboard",
  description = "Single-process loopback daemon runtime & service monitor",
  children,
}: DashboardShellProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border bg-card/60 sticky top-0 z-10 border-b backdrop-blur-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-xs">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Radio className="text-primary size-3 animate-pulse" />
              127.0.0.1:4000
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>

      <footer className="border-border text-muted-foreground border-t py-4 text-center text-xs">
        DevTools Monorepo &copy; 2026 &bull; Single-Process Loopback Daemon
      </footer>
    </div>
  );
}

export interface DashboardPageProps {
  autoFetch?: boolean;
}

interface StackComponentInfo {
  title: string;
  packageName: string;
  description: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STACK_COMPONENTS: StackComponentInfo[] = [
  {
    title: "Shared Domain Core",
    packageName: "@devtools/core",
    description: "Strict runtime schema validation active via Zod.",
    detail: "HealthResponseSchema verified",
    icon: Box,
  },
  {
    title: "Loopback Daemon",
    packageName: "@devtools/cli",
    description:
      "Serves static export bundle at / and routes /api/* on port 4000.",
    detail: "Single-process daemon serving",
    icon: Terminal,
  },
  {
    title: "Web Application Shell",
    packageName: "@devtools/frontend",
    description: "Feature-Sliced Design v2.1 static HTML/CSS/JS export.",
    detail: "Dist Directory: apps/frontend/dist",
    icon: Layers,
  },
];

export function DashboardPage({ autoFetch = true }: DashboardPageProps) {
  const { data, status, error, refresh } = useServiceHealth({
    endpoint: "/api/health",
    pollingInterval: 5000,
    autoFetch,
  });

  const isLoading = status === "loading";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Active Services</h2>
          <p className="text-muted-foreground text-sm">
            Monitored components within the interconnected runtime stack.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <ServiceStatusCard
            name="DevTools API Service"
            data={data}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
          />

          {STACK_COMPONENTS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.packageName}
                className="flex flex-col justify-between"
              >
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.packageName}</CardDescription>
                  <CardAction>
                    <div className="bg-primary/10 text-primary rounded-md p-2">
                      <Icon className="size-4" />
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                    <div className="text-foreground flex items-center gap-2 pt-1 font-mono text-xs">
                      <span>{item.detail}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
