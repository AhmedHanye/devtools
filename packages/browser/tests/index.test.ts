import { describe, expect, test } from "bun:test";
import * as browser from "../src/index";

describe("@devtools/browser exports", () => {
  test("exports public browser contracts, functions, and error classes", () => {
    expect(typeof browser.resolveBrowserPath).toBe("function");
    expect(typeof browser.getBrowserStatus).toBe("function");
    expect(typeof browser.installBrowser).toBe("function");

    expect(browser.BrowserNotFoundError).toBeDefined();
    expect(browser.InvalidBrowserPathError).toBeDefined();
  });
});
