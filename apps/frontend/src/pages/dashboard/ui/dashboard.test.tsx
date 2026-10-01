import type { HealthResponse } from "@devtools/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard-page";
import { DashboardShell } from "./dashboard-shell";
import { ServiceStatusCard } from "./service-status-card";

describe("Dashboard UI components", () => {
  const mockHealthyData: HealthResponse = {
    status: "ok",
    timestamp: "2026-10-01T12:00:00.000Z",
    uptime: 3600,
    version: "0.1.0",
  };

  it("renders ServiceStatusCard with operational active service state", () => {
    render(
      <ServiceStatusCard
        name="DevTools API Service"
        data={mockHealthyData}
        isLoading={false}
        error={null}
      />,
    );

    expect(screen.getByText("DevTools API Service")).toBeDefined();
    expect(screen.getByText("Operational")).toBeDefined();
    expect(screen.getByText("v0.1.0")).toBeDefined();
    expect(screen.getByText(/3600s/)).toBeDefined();
  });

  it("renders ServiceStatusCard degraded and error statuses properly", () => {
    const degradedData: HealthResponse = {
      ...mockHealthyData,
      status: "degraded",
    };

    const { rerender } = render(
      <ServiceStatusCard
        name="DevTools API Service"
        data={degradedData}
        isLoading={false}
        error={null}
      />,
    );
    expect(screen.getByText("Degraded")).toBeDefined();

    const errorData: HealthResponse = {
      ...mockHealthyData,
      status: "error",
    };
    rerender(
      <ServiceStatusCard
        name="DevTools API Service"
        data={errorData}
        isLoading={false}
        error={null}
      />,
    );
    expect(screen.getByText("Error")).toBeDefined();
  });

  it("renders ServiceStatusCard with error banner when error exists", () => {
    render(
      <ServiceStatusCard
        name="DevTools API Service"
        data={null}
        isLoading={false}
        error={new Error("Failed to reach daemon at 127.0.0.1:4000")}
      />,
    );

    expect(screen.getByText("Unreachable")).toBeDefined();
    expect(
      screen.getByText("Failed to reach daemon at 127.0.0.1:4000"),
    ).toBeDefined();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(
      <ServiceStatusCard
        name="DevTools API Service"
        data={mockHealthyData}
        isLoading={false}
        error={null}
        onRefresh={onRefresh}
      />,
    );

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders DashboardShell with header, description and children", () => {
    render(
      <DashboardShell title="DevTools Dashboard" description="Runtime Monitors">
        <div data-testid="child-content">Active Content</div>
      </DashboardShell>,
    );

    expect(screen.getByText("DevTools Dashboard")).toBeDefined();
    expect(screen.getByText("Runtime Monitors")).toBeDefined();
    expect(screen.getByTestId("child-content")).toBeDefined();
  });

  it("renders complete DashboardPage with active service status", async () => {
    render(<DashboardPage autoFetch={false} />);

    expect(screen.getByText(/DevTools System Dashboard/i)).toBeDefined();
    expect(screen.getByText(/API Service/i)).toBeDefined();
  });
});
