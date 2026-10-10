import { docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";
import { createElement } from "react";
import * as icons from "lucide-react";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;
    if (icon in icons) {
      const Comp = icons[icon as keyof typeof icons] as React.ComponentType<{
        className?: string;
      }>;
      return createElement(Comp, { className: "size-4" });
    }
  },
});
