import { describe, expect, it } from "bun:test";
import { source } from "../src/lib/source";

describe("documentation source loader", () => {
  it("initializes documentation source with valid pages", () => {
    expect(source).toBeDefined();
    const pages = source.getPages();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);
  });

  it("resolves root documentation page with correct url and path", () => {
    const page = source.getPage([]);
    expect(page).toBeDefined();
    expect(page?.url).toBe("/docs");
    expect(page?.path).toBe("index.mdx");
  });
});
