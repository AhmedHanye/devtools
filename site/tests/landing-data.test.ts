import { describe, expect, it } from "bun:test";
import {
  DIATAXIS_QUADRANTS,
  GITHUB_REPO_URL,
  HERO_CONFIG,
  NAV_LINKS,
  PLATFORM_FEATURES,
} from "../src/lib/landing-data";

describe("landing-data seam", () => {
  it("defines external repository resources", () => {
    expect(GITHUB_REPO_URL).toBe("https://github.com/AhmedHanye/devtools");
  });

  it("defines focused top navigation links with single docs link and repository", () => {
    expect(NAV_LINKS).toHaveLength(2);
    const hrefs = NAV_LINKS.map((link) => link.href);
    expect(hrefs).toContain("/docs");
    expect(hrefs).toContain(GITHUB_REPO_URL);
  });

  it("defines direct entrypoints for all 4 Diataxis documentation quadrants", () => {
    expect(DIATAXIS_QUADRANTS).toHaveLength(4);
    const quadrantIds = DIATAXIS_QUADRANTS.map((q) => q.id);
    expect(quadrantIds).toEqual([
      "tutorials",
      "how-to",
      "reference",
      "explanation",
    ]);

    for (const quadrant of DIATAXIS_QUADRANTS) {
      expect(quadrant.title).toBeTruthy();
      expect(quadrant.description).toBeTruthy();
      expect(quadrant.href.startsWith("/docs/")).toBe(true);
      expect(quadrant.orientation).toBeTruthy();
      expect(quadrant.icon).toBeTruthy();
    }
  });

  it("defines key platform capability features covering loopback daemon, CLI, and API", () => {
    expect(PLATFORM_FEATURES).toHaveLength(4);
    const titles = PLATFORM_FEATURES.map((f) => f.title.toLowerCase());
    expect(
      titles.some((t) => t.includes("daemon") || t.includes("loopback")),
    ).toBe(true);
    expect(titles.some((t) => t.includes("cli"))).toBe(true);
    expect(titles.some((t) => t.includes("api") || t.includes("hono"))).toBe(
      true,
    );

    for (const feature of PLATFORM_FEATURES) {
      expect(feature.title).toBeTruthy();
      expect(feature.description).toBeTruthy();
      expect(feature.icon).toBeTruthy();
    }
  });

  it("defines hero section with value proposition and loopback daemon architecture", () => {
    expect(HERO_CONFIG.headline).toBe("Fast, Unified Developer Workflows");
    expect(HERO_CONFIG.description.toLowerCase()).toContain("loopback");
    expect(HERO_CONFIG.description.toLowerCase()).toContain("daemon");
    expect(HERO_CONFIG.primaryCta.href).toBe("/docs");
    expect(HERO_CONFIG.secondaryCta.href).toBe(GITHUB_REPO_URL);
  });
});
