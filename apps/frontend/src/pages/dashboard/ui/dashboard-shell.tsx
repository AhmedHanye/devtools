import { Badge } from "@/shared/ui";
import { LayoutDashboard, Radio } from "lucide-react";
import type * as React from "react";

export interface DashboardShellProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  title = "DevTools System Dashboard",
  description = "Single-process loopback daemon runtime & service monitor",
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1 text-xs font-mono">
              <Radio className="size-3 text-emerald-500 animate-pulse" />
              127.0.0.1:4000
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        DevTools Monorepo &copy; 2026 &bull; Single-Process Loopback Daemon
      </footer>
    </div>
  );
}
