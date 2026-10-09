import { describe, expect, it } from "bun:test";
import { GET as getLlmsTxt } from "../src/app/llms.txt/route";
import { GET as getLlmsFullTxt } from "../src/app/llms-full.txt/route";

describe("structured llm context endpoints seam", () => {
  it("exposes plain-text documentation index at /llms.txt", async () => {
    const response = await getLlmsTxt();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("# DevTools");
    expect(text).toContain("[DevTools documentation](/docs)");
    expect(text).toContain("Platform overview and documentation directory");
  });

  it("exposes full plain-text documentation corpus at /llms-full.txt", async () => {
    const response = await getLlmsFullTxt();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("DevTools documentation");
    expect(text).toContain("URL: /docs");
    expect(text).toContain("embedded loopback daemon");
  });
});
