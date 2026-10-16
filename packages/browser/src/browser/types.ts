export type BrowserSource =
  | "explicit"
  | "managed-cache"
  | "system"
  | "edge"
  | "brave"
  | "playwright"
  | "puppeteer";

export interface BrowserResolution {
  executablePath: string;
  version: string;
  source: BrowserSource;
}

export interface ResolveBrowserOptions {
  chromePath?: string;
  env?: Record<string, string | undefined>;
  cacheDir?: string;
  timeoutMs?: number;
}

export type BrowserStatus =
  | {
      found: true;
      path: string;
      version: string;
      source: BrowserSource;
    }
  | {
      found: false;
      error: string;
    };

export interface InstallBrowserOptions {
  cacheDir?: string;
  onProgress?: (downloadedBytes: number, totalBytes: number) => void;
}

export interface InstalledBrowser {
  executablePath: string;
  buildId: string;
  browser: string;
}
