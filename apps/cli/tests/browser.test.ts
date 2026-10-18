import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  createProgram,
  runBrowserInstallCommand,
  runBrowserStatusCommand,
} from "../src/index";

const binPath = resolve(__dirname, "../bin/devtools.js");

describe("CLI Browser Command Surface", () => {
  const testDir = join(
    homedir(),
    ".devtools-test-cli-browser-" + Math.random().toString(36).slice(2),
  );

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("createProgram registers browser command with install and status subcommands", () => {
    const program = createProgram();
    const browserCmd = program.commands.find((cmd) => cmd.name() === "browser");
    expect(browserCmd).toBeDefined();

    const subcommands = browserCmd?.commands.map((cmd) => cmd.name());
    expect(subcommands).toContain("install");
    expect(subcommands).toContain("status");

    const statusCmd = browserCmd?.commands.find(
      (cmd) => cmd.name() === "status",
    );
    const statusOptionNames = statusCmd?.options.map((opt) => opt.name());
    expect(statusOptionNames).toContain("json");
    expect(statusOptionNames).toContain("chrome-path");

    const installCmd = browserCmd?.commands.find(
      (cmd) => cmd.name() === "install",
    );
    const installOptionNames = installCmd?.options.map((opt) => opt.name());
    expect(installOptionNames).toContain("path");
  });

  test("exports runBrowserStatusCommand and runBrowserInstallCommand as async functions", () => {
    expect(typeof runBrowserStatusCommand).toBe("function");
    expect(typeof runBrowserInstallCommand).toBe("function");
  });

  test("status command exits 1 with remediation error in human mode when no browser is found", async () => {
    const isolatedHome = join(testDir, "home");
    mkdirSync(isolatedHome, { recursive: true });

    const proc = Bun.spawn(["bun", binPath, "browser", "status"], {
      env: {
        ...process.env,
        PATH: dirname(process.execPath),
        HOME: isolatedHome,
        DEVTOOLS_BROWSERS_DIR: join(testDir, "empty-cache"),
        CHROME_PATH: "",
        DEVTOOLS_CHROME_PATH: "",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);

    const stderr = await new Response(proc.stderr).text();
    const stdout = await new Response(proc.stdout).text();
    const combined = stderr + stdout;
    expect(combined).toContain("No Chromium-compatible browser found.");
    expect(combined).toContain('Run "devtools browser install"');
  });

  test("status command exits 1 with diagnostic error in human mode when explicit path is invalid", async () => {
    const invalidPath = join(testDir, "non-existent-binary");
    const proc = Bun.spawn(
      ["bun", binPath, "browser", "status", "--chrome-path", invalidPath],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain(
      "Specified browser path is invalid or non-executable",
    );
    expect(stderr).toContain(invalidPath);
  });

  test("status command exits 1 with diagnostic error in human mode when explicit path is empty", async () => {
    const proc = Bun.spawn(
      ["bun", binPath, "browser", "status", "--chrome-path", ""],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain(
      "explicit --chrome-path cannot be empty or whitespace",
    );
  });

  test("status command exits 1 with JSON payload in --json mode when no browser is found", async () => {
    const isolatedHome = join(testDir, "home");
    mkdirSync(isolatedHome, { recursive: true });

    const proc = Bun.spawn(["bun", binPath, "browser", "status", "--json"], {
      env: {
        ...process.env,
        PATH: dirname(process.execPath),
        HOME: isolatedHome,
        DEVTOOLS_BROWSERS_DIR: join(testDir, "empty-cache"),
        CHROME_PATH: "",
        DEVTOOLS_CHROME_PATH: "",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);

    const stdout = await new Response(proc.stdout).text();
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.found).toBe(false);
    expect(parsed.code).toBe("BROWSER_NOT_FOUND");
    expect(parsed.error).toContain("No Chromium-compatible browser found.");
    expect(parsed.error).toContain('Run "devtools browser install"');
  });

  test("status command exits 0 with details when valid browser is resolved via explicit env", async () => {
    const mockBin = join(testDir, "mock-browser.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Mock Chromium 131.0.0"\n');
    chmodSync(mockBin, 0o755);

    const proc = Bun.spawn(["bun", binPath, "browser", "status"], {
      env: {
        ...process.env,
        DEVTOOLS_CHROME_PATH: mockBin,
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const stdout = await new Response(proc.stdout).text();
    expect(stdout).toContain(mockBin);
    expect(stdout).toContain("Mock Chromium 131.0.0");
    expect(stdout).toContain("explicit");
  });

  test("status command exits 0 with JSON payload in --json mode when valid browser is resolved", async () => {
    const mockBin = join(testDir, "mock-browser.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Mock Chromium 131.0.0"\n');
    chmodSync(mockBin, 0o755);

    const proc = Bun.spawn(["bun", binPath, "browser", "status", "--json"], {
      env: {
        ...process.env,
        DEVTOOLS_CHROME_PATH: mockBin,
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const stdout = await new Response(proc.stdout).text();
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.found).toBe(true);
    expect(parsed.path).toBe(mockBin);
    expect(parsed.version).toBe("Mock Chromium 131.0.0");
    expect(parsed.source).toBe("explicit");
  });

  test("status command respects explicit --chrome-path flag", async () => {
    const mockBin = join(testDir, "explicit-flag-browser.sh");
    writeFileSync(mockBin, '#!/bin/sh\necho "Flag Chromium 132.0.0"\n');
    chmodSync(mockBin, 0o755);

    const proc = Bun.spawn(
      ["bun", binPath, "browser", "status", "--chrome-path", mockBin, "--json"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const stdout = await new Response(proc.stdout).text();
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.found).toBe(true);
    expect(parsed.path).toBe(mockBin);
    expect(parsed.version).toBe("Flag Chromium 132.0.0");
    expect(parsed.source).toBe("explicit");
  });

  test("install command --help outputs description and --path option", async () => {
    const proc = Bun.spawn(["bun", binPath, "browser", "install", "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const stdout = await new Response(proc.stdout).text();
    expect(stdout).toContain("Install Chrome for Testing");
    expect(stdout).toContain("--path <dir>");
  });

  test("runBrowserInstallCommand executes installer and outputs success", async () => {
    const mockInstalledPath = join(testDir, "installed-browser");
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: any[]) => logs.push(args.join(" "));

    try {
      await runBrowserInstallCommand(
        { path: testDir },
        {
          installBrowser: async (opts) => {
            opts?.onProgress?.(50, 100);
            return {
              executablePath: mockInstalledPath,
              buildId: "130.0.6723.69",
              browser: "chrome-headless-shell",
            };
          },
        },
      );

      const combinedLogs = logs.join("\n");
      expect(combinedLogs).toContain("Successfully installed");
      expect(combinedLogs).toContain("chrome-headless-shell@130.0.6723.69");
      expect(combinedLogs).toContain(mockInstalledPath);
    } finally {
      console.log = origLog;
    }
  });

  test("runBrowserInstallCommand logs error and exits code 1 on failure", async () => {
    const errLogs: string[] = [];
    const origErr = console.error;
    console.error = (...args: any[]) => errLogs.push(args.join(" "));

    let exitCalledWith: number | undefined;
    const origExit = process.exit;
    process.exit = ((code?: number) => {
      exitCalledWith = code;
      throw new Error(`process.exit called with ${code}`);
    }) as any;

    try {
      await expect(
        runBrowserInstallCommand(
          { path: testDir },
          {
            installBrowser: async () => {
              throw new Error("Disk full error");
            },
          },
        ),
      ).rejects.toThrow("process.exit called with 1");

      expect(exitCalledWith).toBe(1);
      const combinedErrors = errLogs.join("\n");
      expect(combinedErrors).toContain(
        "Failed to install browser: Disk full error",
      );
    } finally {
      console.error = origErr;
      process.exit = origExit;
    }
  });
});
