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
