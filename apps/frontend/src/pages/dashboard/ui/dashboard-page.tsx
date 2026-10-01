"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { Box, Layers, Terminal } from "lucide-react";
import type * as React from "react";
import { useServiceHealth } from "../model";
import { DashboardShell } from "./dashboard-shell";
import { ServiceStatusCard } from "./service-status-card";

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
    description: "Serves static export bundle at / and routes /api/* on port 4000.",
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
  const { data, isLoading, error, refresh } = useServiceHealth({
    endpoint: "/api/health",
    pollingInterval: 5000,
    autoFetch,
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Active Services</h2>
          <p className="text-sm text-muted-foreground">
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
                className="flex flex-col justify-between border-border bg-card"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.packageName}</CardDescription>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-2 text-xs text-muted-foreground">
                  <p>{item.description}</p>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-foreground">
                    <span>{item.detail}</span>
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
