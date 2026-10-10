import { docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";
import { statusBadgesPlugin } from "fumadocs-core/source/plugins/status-badges";
import { createElement } from "react";
import * as icons from "lucide-react";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [
    statusBadgesPlugin({
      renderBadge(status) {
        const variants: Record<string, string> = {
          new: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          beta: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          deprecated:
            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        };
        return createElement(
          "span",
          {
            className: `text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${variants[status] ?? "bg-fd-muted text-fd-muted-foreground border-fd-border"}`,
          },
          status,
        );
      },
    }),
  ],
  icon(icon) {
    if (!icon) return;
    if (icon in icons) {
      const Comp = icons[icon as keyof typeof icons] as React.ComponentType<{
        className?: string;
      }>;
      return createElement(Comp, { className: "size-4 text-fd-primary" });
    }
  },
});
