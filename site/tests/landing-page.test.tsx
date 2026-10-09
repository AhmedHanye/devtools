import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../src/app/page";
import {
  DIATAXIS_QUADRANTS,
  GITHUB_REPO_URL,
  HERO_CONFIG,
  PLATFORM_FEATURES,
} from "../src/lib/landing-data";

describe("landing-page view seam", () => {
  const html = renderToStaticMarkup(React.createElement(HomePage));

  it("renders navigation header with single docs link and external repository link", () => {
    expect(html).toContain('href="/docs"');
    expect(html).toContain(`href="${GITHUB_REPO_URL}"`);
    expect(html).toContain("Docs");
  });

  it("renders hero section communicating value proposition and loopback daemon architecture", () => {
    expect(html).toContain(HERO_CONFIG.headline);
    expect(html).toContain("loopback daemon");
    expect(html).toContain("single production Bun process");
    expect(html).toContain(HERO_CONFIG.primaryCta.label);
    expect(html).toContain(`href="${HERO_CONFIG.primaryCta.href}"`);
    expect(html).toContain(`href="${HERO_CONFIG.secondaryCta.href}"`);
  });

  it("renders feature highlight grid presenting key platform capabilities", () => {
    for (const feature of PLATFORM_FEATURES) {
      expect(html).toContain(feature.title);
    }
    expect(html).toContain("grid");
    expect(html).toContain("grid-cols-1");
  });

  it("renders direct navigation entrypoints into all four Diataxis quadrants", () => {
    for (const quadrant of DIATAXIS_QUADRANTS) {
      expect(html).toContain(quadrant.title);
      expect(html).toContain(`href="${quadrant.href}"`);
    }
  });

  it("renders responsive footer with external repository resource link", () => {
    expect(html).toContain("<footer");
    expect(html).toContain(`href="${GITHUB_REPO_URL}"`);
    expect(html).toContain("DevTools");
  });

  it("renders independently from documentation sidebar shell", () => {
    expect(html).not.toContain('id="nd-sidebar"');
    expect(html).not.toContain("fd-sidebar");
  });
});
