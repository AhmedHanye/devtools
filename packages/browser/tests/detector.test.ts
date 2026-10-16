import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  getManagedCacheDir,
  probeAlternativeBrowsers,
  probeManagedCache,
  probeSystemInstallations,
  verifyBrowserExecutable,
} from "../src/browser/detector";

describe("Browser Detector & Executable Verification", () => {
  const testDir = join(
    homedir(),
    ".devtools-test-detector-" + Math.random().toString(36).slice(2),
  );

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("verifyBrowserExecutable succeeds and returns version for executable exiting 0", async () => {
    const mockBin = join(testDir, "mock-browser.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Google Chrome 130.0.6723.69"\n');
    chmodSync(mockBin, 0o755);

    const result = await verifyBrowserExecutable(mockBin, 3000);
    expect(result.valid).toBe(true);
    expect(result.version).toBe("Google Chrome 130.0.6723.69");
  });

  test("verifyBrowserExecutable returns valid=false for non-existent binary", async () => {
    const result = await verifyBrowserExecutable(
      join(testDir, "non-existent-binary"),
      1000,
    );
    expect(result.valid).toBe(false);
    expect(result.version).toBeUndefined();
  });

  test("verifyBrowserExecutable returns valid=false for non-executable file", async () => {
    const mockBin = join(testDir, "mock-unexecutable");
    writeFileSync(mockBin, 'echo "test"');
    chmodSync(mockBin, 0o644);

    const result = await verifyBrowserExecutable(mockBin, 1000);
    expect(result.valid).toBe(false);
  });

  test("verifyBrowserExecutable returns valid=false for binary exiting non-zero", async () => {
    const mockBin = join(testDir, "mock-failing.sh");
    writeFileSync(mockBin, "#!/bin/sh\nexit 1\n");
    chmodSync(mockBin, 0o755);

    const result = await verifyBrowserExecutable(mockBin, 1000);
    expect(result.valid).toBe(false);
  });

  test("verifyBrowserExecutable returns valid=false when execution exceeds timeout", async () => {
    const mockBin = join(testDir, "mock-hanging.sh");
    writeFileSync(mockBin, "#!/bin/sh\nsleep 2\necho 'done'\n");
    chmodSync(mockBin, 0o755);

    const result = await verifyBrowserExecutable(mockBin, 100);
    expect(result.valid).toBe(false);
  });

  test("getManagedCacheDir resolves DEVTOOLS_BROWSERS_DIR override or default", () => {
    expect(getManagedCacheDir({ DEVTOOLS_BROWSERS_DIR: "/custom/cache" })).toBe(
      "/custom/cache",
    );
    expect(getManagedCacheDir({})).toBe(
      join(homedir(), ".devtools", "browsers"),
    );
  });

  test("probeSystemInstallations returns array without throwing even if none found", async () => {
    const installations = await probeSystemInstallations();
    expect(Array.isArray(installations)).toBe(true);
  });

  test("probeAlternativeBrowsers returns array of existing browser paths", async () => {
    const altBrowsers = await probeAlternativeBrowsers();
    expect(Array.isArray(altBrowsers)).toBe(true);
  });

  test("probeManagedCache returns null when cache is empty", async () => {
    const result = await probeManagedCache(testDir);
    expect(result).toBeNull();
  });
});
