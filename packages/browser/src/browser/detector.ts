import {
  accessSync,
  constants,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { getInstalledBrowsers } from "@puppeteer/browsers";
import * as chromeLauncher from "chrome-launcher";

export interface VerificationResult {
  valid: boolean;
  version?: string;
}

export interface CandidateBrowser<TSource extends string = string> {
  path: string;
  source: TSource;
}

function isExecutable(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) return false;
    const stat = statSync(filePath);
    if (!stat.isFile()) return false;
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function verifyBrowserExecutable(
  executablePath: string,
  timeoutMs = 3000,
): Promise<VerificationResult> {
  if (!isExecutable(executablePath)) {
    return { valid: false };
  }

  let proc: ReturnType<typeof Bun.spawn> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const exitedPromise = new Promise<{ code: number; stdout: string }>(
      (resolve, reject) => {
        try {
          proc = Bun.spawn([executablePath, "--version"], {
            stdout: "pipe",
            stderr: "pipe",
          });

          timer = setTimeout(() => {
            try {
              proc?.kill();
            } catch {
              // ignore
            }
            resolve({ code: -1, stdout: "" });
          }, timeoutMs);

          const stdoutPromise =
            proc.stdout && typeof proc.stdout !== "number"
              ? new Response(proc.stdout).text()
              : Promise.resolve("");

          Promise.all([proc.exited, stdoutPromise])
            .then(([code, text]) => {
              if (timer) clearTimeout(timer);
              resolve({ code, stdout: text });
            })
            .catch((err) => {
              if (timer) clearTimeout(timer);
              reject(err);
            });
        } catch (err) {
          if (timer) clearTimeout(timer);
          reject(err);
        }
      },
    );

    const { code, stdout } = await exitedPromise;

    if (code === 0 && stdout.trim().length > 0) {
      const firstLine = stdout.trim().split("\n")[0].trim();
      return { valid: true, version: firstLine };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  } finally {
    if (timer) clearTimeout(timer);
    try {
      proc?.kill();
    } catch {
      // ignore
    }
  }
}

export function getManagedCacheDir(
  env?: Record<string, string | undefined>,
): string {
  const currentEnv = env ?? process.env;
  return (
    currentEnv.DEVTOOLS_BROWSERS_DIR ?? join(homedir(), ".devtools", "browsers")
  );
}

export async function probeManagedCache(
  cacheDir?: string,
  env?: Record<string, string | undefined>,
  timeoutMs?: number,
): Promise<{ path: string; version: string } | null> {
  const targetDir = cacheDir ?? getManagedCacheDir(env);
  if (!existsSync(targetDir)) {
    return null;
  }

  try {
    const installed = await getInstalledBrowsers({ cacheDir: targetDir });
    for (const browser of installed) {
      if (browser.executablePath && existsSync(browser.executablePath)) {
        const check = await verifyBrowserExecutable(
          browser.executablePath,
          timeoutMs,
        );
        if (check.valid && check.version) {
          return {
            path: browser.executablePath,
            version: check.version,
          };
        }
      }
    }
  } catch {
    // Return null if reading cache fails
  }

  return null;
}

export async function probeSystemInstallations(): Promise<string[]> {
  try {
    const installations = chromeLauncher.Launcher.getInstallations();
    return Array.from(new Set(installations.filter((p) => existsSync(p))));
  } catch {
    return [];
  }
}

export async function probeAlternativeBrowsers(): Promise<
  Array<CandidateBrowser<"edge" | "brave">>
> {
  const osType = platform();
  const rawCandidates: Array<{ path: string; source: "edge" | "brave" }> = [];

  if (osType === "linux") {
    rawCandidates.push(
      { path: "/usr/bin/microsoft-edge", source: "edge" },
      { path: "/usr/bin/microsoft-edge-stable", source: "edge" },
      { path: "/usr/bin/microsoft-edge-dev", source: "edge" },
      { path: "/usr/bin/msedge", source: "edge" },
      { path: "/usr/bin/brave-browser", source: "brave" },
      { path: "/usr/bin/brave", source: "brave" },
      { path: "/snap/bin/brave", source: "brave" },
    );
  } else if (osType === "darwin") {
    rawCandidates.push(
      {
        path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        source: "edge",
      },
      {
        path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        source: "brave",
      },
    );
  } else if (osType === "win32") {
    const programFiles = process.env["PROGRAMFILES"] ?? "C:\\Program Files";
    const programFilesX86 =
      process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
    rawCandidates.push(
      {
        path: join(
          programFilesX86,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        ),
        source: "edge",
      },
      {
        path: join(
          programFiles,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        ),
        source: "edge",
      },
      {
        path: join(
          programFiles,
          "BraveSoftware",
          "Brave-Browser",
          "Application",
          "brave.exe",
        ),
        source: "brave",
      },
    );
  }

  return rawCandidates.filter((item) => isExecutable(item.path));
}

export async function probeToolCaches(
  home = homedir(),
): Promise<Array<CandidateBrowser<"playwright" | "puppeteer">>> {
  const osType = platform();
  const found: Array<CandidateBrowser<"playwright" | "puppeteer">> = [];

  // 1. Playwright cache (~/.cache/ms-playwright)
  const playwrightBase =
    osType === "darwin"
      ? join(home, "Library", "Caches", "ms-playwright")
      : join(home, ".cache", "ms-playwright");

  if (existsSync(playwrightBase)) {
    try {
      const entries = readdirSync(playwrightBase);
      for (const entry of entries) {
        if (entry.startsWith("chromium-")) {
          const chromeLinux = join(
            playwrightBase,
            entry,
            "chrome-linux",
            "chrome",
          );
          const chromeMac = join(
            playwrightBase,
            entry,
            "chrome-mac",
            "Chromium.app",
            "Contents",
            "MacOS",
            "Chromium",
          );
          const chromeWin = join(
            playwrightBase,
            entry,
            "chrome-win",
            "chrome.exe",
          );

          for (const candidate of [chromeLinux, chromeMac, chromeWin]) {
            if (isExecutable(candidate)) {
              found.push({ path: candidate, source: "playwright" });
            }
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // 2. Puppeteer cache (~/.cache/puppeteer)
  const puppeteerBase =
    osType === "darwin"
      ? join(home, "Library", "Caches", "puppeteer")
      : join(home, ".cache", "puppeteer");

  if (existsSync(puppeteerBase)) {
    try {
      const installed = await getInstalledBrowsers({ cacheDir: puppeteerBase });
      for (const browser of installed) {
        if (browser.executablePath && isExecutable(browser.executablePath)) {
          found.push({ path: browser.executablePath, source: "puppeteer" });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return found;
}
