import type { Meta, StoryObj } from "@storybook/react";
import { ServiceStatusCard } from "./service-status-card";

const meta: Meta<typeof ServiceStatusCard> = {
  title: "Dashboard/ServiceStatusCard",
  component: ServiceStatusCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ServiceStatusCard>;

export const Operational: Story = {
  args: {
    name: "DevTools API Service",
    data: {
      status: "ok",
      timestamp: "2026-10-01T12:00:00.000Z",
      uptime: 3600,
      version: "0.1.0",
    },
    isLoading: false,
    error: null,
  },
};

export const Degraded: Story = {
  args: {
    name: "DevTools API Service",
    data: {
      status: "degraded",
      timestamp: "2026-10-01T12:00:00.000Z",
      uptime: 1200,
      version: "0.1.0",
    },
    isLoading: false,
    error: null,
  },
};

export const ErrorState: Story = {
  args: {
    name: "DevTools API Service",
    data: {
      status: "error",
      timestamp: "2026-10-01T12:00:00.000Z",
      uptime: 45,
      version: "0.1.0",
    },
    isLoading: false,
    error: null,
  },
};

export const Unreachable: Story = {
  args: {
    name: "DevTools API Service",
    data: null,
    isLoading: false,
    error: new Error("Connection refused: 127.0.0.1:4000"),
  },
};
