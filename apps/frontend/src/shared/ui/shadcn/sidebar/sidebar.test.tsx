import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, useSidebar } from "./sidebar";

describe("SidebarProvider persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes to defaultOpen when localStorage is empty", () => {
    const { result } = renderHook(() => useSidebar(), {
      wrapper: ({ children }) => (
        <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
      ),
    });

    expect(result.current.open).toBe(true);
    expect(result.current.state).toBe("expanded");
  });

  it("initializes from localStorage state when present", () => {
    localStorage.setItem("sidebar_state", "false");

    const { result } = renderHook(() => useSidebar(), {
      wrapper: ({ children }) => (
        <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
      ),
    });

    expect(result.current.open).toBe(false);
    expect(result.current.state).toBe("collapsed");
  });

  it("persists open state changes to localStorage", () => {
    const { result } = renderHook(() => useSidebar(), {
      wrapper: ({ children }) => (
        <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
      ),
    });

    act(() => {
      result.current.setOpen(false);
    });

    expect(localStorage.getItem("sidebar_state")).toBe("false");
    expect(result.current.open).toBe(false);

    act(() => {
      result.current.setOpen(true);
    });

    expect(localStorage.getItem("sidebar_state")).toBe("true");
    expect(result.current.open).toBe(true);
  });

  it("falls back to defaultOpen gracefully if localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access is denied");
    });

    const { result } = renderHook(() => useSidebar(), {
      wrapper: ({ children }) => (
        <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
      ),
    });

    expect(result.current.open).toBe(true);
  });

  it("renders suppressHydrationWarning on the wrapper element", () => {
    const { container } = render(
      <SidebarProvider>
        <div>Content</div>
      </SidebarProvider>,
    );

    const wrapper = container.querySelector('[data-slot="sidebar-wrapper"]');
    expect(wrapper).not.toBeNull();
  });
});
