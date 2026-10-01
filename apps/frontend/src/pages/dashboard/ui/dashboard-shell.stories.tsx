import type { Meta, StoryObj } from "@storybook/react";
import { DashboardShell } from "./dashboard-shell";

const meta: Meta<typeof DashboardShell> = {
  title: "Dashboard/DashboardShell",
  component: DashboardShell,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DashboardShell>;

export const Default: Story = {
  args: {
    title: "DevTools System Dashboard",
    description: "Single-process loopback daemon runtime & service monitor",
    children: (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Dashboard content area
      </div>
    ),
  },
};
