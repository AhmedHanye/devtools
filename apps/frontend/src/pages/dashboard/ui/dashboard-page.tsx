"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
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
