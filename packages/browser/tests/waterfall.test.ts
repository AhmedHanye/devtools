import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  BrowserNotFoundError,
  InvalidBrowserPathError,
} from "../src/browser/errors";
import { getBrowserStatus, resolveBrowserPath } from "../src/browser/waterfall";

describe("Browser Resolution Waterfall", () => {
  const testDir = join(
    homedir(),
    ".devtools-test-waterfall-" + Math.random().toString(36).slice(2),
  );

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("Tier 1: returns explicit resolution when valid --chrome-path is passed", async () => {
    const mockBin = join(testDir, "custom-chrome.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Custom Chrome 120.0.0"\n');
    chmodSync(mockBin, 0o755);

    const resolution = await resolveBrowserPath({ chromePath: mockBin });
    expect(resolution.executablePath).toBe(mockBin);
    expect(resolution.version).toBe("Custom Chrome 120.0.0");
    expect(resolution.source).toBe("explicit");
  });

  test("Tier 1: respects DEVTOOLS_CHROME_PATH and CHROME_PATH environment variables", async () => {
    const mockBin = join(testDir, "env-chrome.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Env Chrome 121.0.0"\n');
    chmodSync(mockBin, 0o755);

    const res1 = await resolveBrowserPath({
      env: { DEVTOOLS_CHROME_PATH: mockBin },
    });
    expect(res1.executablePath).toBe(mockBin);
    expect(res1.source).toBe("explicit");

    const res2 = await resolveBrowserPath({ env: { CHROME_PATH: mockBin } });
    expect(res2.executablePath).toBe(mockBin);
    expect(res2.source).toBe("explicit");
  });

  test("Tier 1: strictly throws InvalidBrowserPathError on non-existent explicit path and does NOT fall back", async () => {
    const missingPath = join(testDir, "missing-chrome");
    await expect(
      resolveBrowserPath({ chromePath: missingPath }),
    ).rejects.toThrow(InvalidBrowserPathError);
  });

  test("Tier 1: strictly throws InvalidBrowserPathError on non-executable or failing explicit path", async () => {
    const failingBin = join(testDir, "failing-chrome.sh");
    writeFileSync(failingBin, "#!/bin/sh\nexit 1\n");
    chmodSync(failingBin, 0o755);

    await expect(
      resolveBrowserPath({ chromePath: failingBin }),
    ).rejects.toThrow(InvalidBrowserPathError);
  });

  test("Tier 2: resolves from managed cache directory when present", async () => {
    const cacheDir = join(testDir, "managed-browsers");
    mkdirSync(cacheDir, { recursive: true });

    const mockHeadless = join(cacheDir, "mock-headless.sh");
    writeFileSync(
      mockHeadless,
      '#!/bin/sh\necho "Chrome for Testing 130.0.0"\n',
    );
    chmodSync(mockHeadless, 0o755);

    const resolution = await resolveBrowserPath(
      {
        cacheDir,
        env: {
          DEVTOOLS_BROWSERS_DIR: cacheDir,
          CHROME_PATH: undefined,
          DEVTOOLS_CHROME_PATH: undefined,
        },
      },
      {
        probeManagedCache: async () => ({
          path: mockHeadless,
          version: "Chrome for Testing 130.0.0",
        }),
      },
    );

    expect(resolution.executablePath).toBe(mockHeadless);
    expect(resolution.source).toBe("managed-cache");
  });

  test("Tier 2: probes system installations when managed cache is empty", async () => {
    const mockSysBin = join(testDir, "system-chromium.sh");
    writeFileSync(mockSysBin, '#!/bin/sh\necho "Chromium 129.0.0"\n');
    chmodSync(mockSysBin, 0o755);

    const resolution = await resolveBrowserPath(
      {
        env: { CHROME_PATH: undefined, DEVTOOLS_CHROME_PATH: undefined },
      },
      {
        probeManagedCache: async () => null,
        probeSystemInstallations: async () => [mockSysBin],
      },
    );

    expect(resolution.executablePath).toBe(mockSysBin);
    expect(resolution.source).toBe("system");
  });

  test("Tier 2: probes alternative browsers (edge and brave) when system chrome is absent", async () => {
    const mockEdgeBin = join(testDir, "microsoft-edge.sh");
    writeFileSync(mockEdgeBin, '#!/bin/sh\necho "Microsoft Edge 128.0.0"\n');
    chmodSync(mockEdgeBin, 0o755);

    const resolution = await resolveBrowserPath(
      {
        env: { CHROME_PATH: undefined, DEVTOOLS_CHROME_PATH: undefined },
      },
      {
        probeManagedCache: async () => null,
        probeSystemInstallations: async () => [],
        probeAlternativeBrowsers: async () => [
          { path: mockEdgeBin, source: "edge" },
        ],
      },
    );

    expect(resolution.executablePath).toBe(mockEdgeBin);
    expect(resolution.source).toBe("edge");
  });

  test("Tier 3: throws BrowserNotFoundError with actionable remediation guidance when no browser is found", async () => {
    await expect(
      resolveBrowserPath(
        {
          env: { CHROME_PATH: undefined, DEVTOOLS_CHROME_PATH: undefined },
        },
        {
          probeManagedCache: async () => null,
          probeSystemInstallations: async () => [],
          probeAlternativeBrowsers: async () => [],
          probeToolCaches: async () => [],
        },
      ),
    ).rejects.toThrow(BrowserNotFoundError);

    try {
      await resolveBrowserPath(
        {
          env: { CHROME_PATH: undefined, DEVTOOLS_CHROME_PATH: undefined },
        },
        {
          probeManagedCache: async () => null,
          probeSystemInstallations: async () => [],
          probeAlternativeBrowsers: async () => [],
          probeToolCaches: async () => [],
        },
      );
    } catch (err: any) {
      expect(err.message).toContain("No Chromium-compatible browser found.");
      expect(err.message).toContain('Run "devtools browser install"');
      expect(err.message).toContain('or pass "--chrome-path <path>"');
    }
  });

  test("getBrowserStatus returns found=true on success and clean single-line error on failure", async () => {
    const mockBin = join(testDir, "status-chrome.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Chrome 130.0.0"\n');
    chmodSync(mockBin, 0o755);

    const foundStatus = await getBrowserStatus({ chromePath: mockBin });
    expect(foundStatus.found).toBe(true);
    if (foundStatus.found) {
      expect(foundStatus.path).toBe(mockBin);
      expect(foundStatus.version).toBe("Chrome 130.0.0");
      expect(foundStatus.source).toBe("explicit");
    }

    const missingStatus = await getBrowserStatus(
      {
        env: { CHROME_PATH: undefined, DEVTOOLS_CHROME_PATH: undefined },
      },
      {
        probeManagedCache: async () => null,
        probeSystemInstallations: async () => [],
        probeAlternativeBrowsers: async () => [],
        probeToolCaches: async () => [],
      },
    );
    expect(missingStatus.found).toBe(false);
    if (!missingStatus.found) {
      expect(missingStatus.error).toBe("No Chromium-compatible browser found.");
    }
  });
});
