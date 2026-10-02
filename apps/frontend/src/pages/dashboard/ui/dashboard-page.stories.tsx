import type { Meta, StoryObj } from "@storybook/react";
import { DashboardPage } from "./dashboard-page";

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/DashboardPage",
  component: DashboardPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

export const Default: Story = {
  args: {
    autoFetch: false,
  },
};

export const LivePolling: Story = {
  args: {
    autoFetch: true,
  },
};
