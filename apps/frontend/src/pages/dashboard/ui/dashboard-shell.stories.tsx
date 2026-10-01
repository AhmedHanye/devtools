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
      <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        Dashboard content area
      </div>
    ),
  },
};
