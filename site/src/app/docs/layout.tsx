import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import { source } from "@/lib/source";
import { DIATAXIS_QUADRANTS } from "@/lib/landing-data";

export const DOCS_SECTION_TABS: LayoutTab[] = [
  {
    title: "Overview",
    url: "/docs",
  },
  ...DIATAXIS_QUADRANTS.map((quadrant) => ({
    title: quadrant.title,
    url: quadrant.href,
    description: quadrant.description,
  })),
];

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: "DevTools",
        url: "/docs",
      }}
      tabMode="auto"
      tabs={DOCS_SECTION_TABS}
      sidebar={{
        collapsible: true,
      }}
    >
      {children}
    </DocsLayout>
  );
}
