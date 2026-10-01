import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("handles conditional classes and falsy values", () => {
    expect(cn("base-class", false && "hidden", null, undefined, "active")).toBe(
      "base-class active",
    );
  });

  it("resolves conflicting tailwind classes with twMerge", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });
});
