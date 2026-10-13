import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders horizontal orientation by default with expected styling", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).not.toBeNull();
    expect(separator?.getAttribute("data-orientation")).toBe("horizontal");
    expect(separator?.getAttribute("role")).toBe("separator");
    expect(separator?.className).toContain(
      "data-[orientation=horizontal]:h-px",
    );
    expect(separator?.className).toContain(
      "data-[orientation=horizontal]:w-full",
    );
  });

  it("renders vertical orientation when specified", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).not.toBeNull();
    expect(separator?.getAttribute("data-orientation")).toBe("vertical");
    expect(separator?.className).toContain("data-[orientation=vertical]:w-px");
    expect(separator?.className).toContain(
      "data-[orientation=vertical]:h-full",
    );
  });
});
