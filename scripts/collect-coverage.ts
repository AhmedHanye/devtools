import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface LcovEntry {
  content: string;
  baseDir: string;
}

/**
 * Normalizes all SF: paths in LCOV content to be repository-relative.
 */
export function normalizeLcovPaths(
  entryOrContent: LcovEntry | string,
  baseDirOrRepoRoot?: string,
  maybeRepoRoot?: string,
): string {
  let lcovContent: string;
  let baseDir: string;
  let repoRoot: string;

  if (typeof entryOrContent === "object" && entryOrContent !== null) {
    lcovContent = entryOrContent.content;
    baseDir = entryOrContent.baseDir;
    repoRoot = baseDirOrRepoRoot ?? process.cwd();
  } else {
    lcovContent = entryOrContent;
    baseDir = baseDirOrRepoRoot ?? process.cwd();
    repoRoot = maybeRepoRoot ?? process.cwd();
  }

  if (!lcovContent || !lcovContent.trim()) {
    return "";
  }

  const lines = lcovContent.split("\n");
  const normalizedLines = lines.map((line) => {
    if (!line.startsWith("SF:")) {
      return line;
    }

    const rawPath = line.slice(3).trim();
    let absPath: string;

    if (path.isAbsolute(rawPath)) {
      absPath = rawPath;
    } else {
      absPath = path.resolve(baseDir, rawPath);
    }

    const relPath = path.relative(repoRoot, absPath).replace(/\\/g, "/");
    return `SF:${relPath}`;
  });

  return normalizedLines.join("\n");
}

/**
 * Merges multiple LCOV entries into a single unified LCOV string with normalized paths.
 */
export function mergeLcovContents(
  entries: LcovEntry[],
  repoRoot: string,
): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  const mergedChunks: string[] = [];

  for (const entry of entries) {
    const normalized = normalizeLcovPaths(entry, repoRoot).trim();
    if (normalized) {
      mergedChunks.push(normalized);
    }
  }

  if (mergedChunks.length === 0) {
    return "";
  }

  return mergedChunks.join("\n") + "\n";
}

/**
 * Runs Bun tests with coverage for a directory.
 */
function runBunCoverage(cwd: string, extraArgs: string[] = []): void {
  const args = ["test", "--coverage", "--coverage-reporter=lcov", ...extraArgs];
  const res = spawnSync("bun", args, {
    cwd,
    stdio: "inherit",
  });
  if (res.status !== 0) {
    throw new Error(`Test suite failed in ${cwd} with exit code ${res.status}`);
  }
}

/**
 * Executes test suites with coverage across workspaces and merges the resulting LCOV files.
 */
export async function collectCoverage(
  options: {
    repoRoot?: string;
    outputDir?: string;
  } = {},
): Promise<{ mergedCount: number; outputPath: string }> {
  const root = options.repoRoot ?? process.cwd();
  const mergedLcovDir = options.outputDir ?? path.join(root, "coverage");
  const mergedLcovPath = path.join(mergedLcovDir, "lcov.info");

  fs.mkdirSync(mergedLcovDir, { recursive: true });

  const bunWorkspaces = [
    "packages/core",
    "packages/db",
    "packages/browser",
    "apps/cli",
    "apps/api",
    "site",
  ];

  // 1. Run Bun tests with LCOV coverage on native packages and site
  for (const pkg of bunWorkspaces) {
    const pkgDir = path.join(root, pkg);
    if (fs.existsSync(pkgDir)) {
      console.log(`Running coverage for ${pkg}...`);
      runBunCoverage(pkgDir, ["--coverage-dir=coverage"]);
    }
  }

  // 2. Run root scripts test coverage into coverage/scripts/ to avoid collision with final merged output
  console.log("Running coverage for scripts/...");
  runBunCoverage(root, ["--coverage-dir=coverage/scripts", "scripts/"]);

  // 3. Run frontend Vitest coverage
  if (fs.existsSync(path.join(root, "apps/frontend"))) {
    console.log("Running coverage for apps/frontend (Vitest)...");
    const frontendRes = spawnSync(
      "bun",
      ["--filter", "@devtools/frontend", "test", "--", "--coverage"],
      {
        cwd: root,
        stdio: "inherit",
      },
    );
    if (frontendRes.status !== 0) {
      throw new Error(
        `Vitest coverage failed for apps/frontend with exit code ${frontendRes.status}`,
      );
    }
  }

  // 4. Find all generated lcov.info files
  const lcovEntries: LcovEntry[] = [];

  function scanForLcov(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === ".next" ||
          entry.name === ".source"
        ) {
          continue;
        }
        scanForLcov(fullPath);
      } else if (entry.isFile() && entry.name === "lcov.info") {
        if (fullPath !== mergedLcovPath) {
          const content = fs.readFileSync(fullPath, "utf8");
          // The base directory for relative paths in this lcov file is typically the workspace root
          // i.e. two levels up from <workspace>/coverage/lcov.info (or root for scripts)
          const parentDir = path.dirname(fullPath);
          const isScripts = parentDir.endsWith("coverage/scripts");
          const workspaceDir = isScripts ? root : path.dirname(parentDir);
          let filteredContent = content;
          if (isScripts) {
            const records = content.split("end_of_record\n");
            filteredContent = records
              .filter((rec) => {
                const sfMatch = rec.match(/SF:(.+)/);
                if (!sfMatch) return false;
                const p = sfMatch[1]!.trim();
                return p.startsWith("scripts/") || p.startsWith("./scripts/");
              })
              .join("end_of_record\n");
            if (filteredContent && !filteredContent.endsWith("\n")) {
              filteredContent += "\n";
            }
          }
          lcovEntries.push({ content: filteredContent, baseDir: workspaceDir });
        }
      }
    }
  }

  scanForLcov(root);

  const unifiedLcov = mergeLcovContents(lcovEntries, root);
  fs.writeFileSync(mergedLcovPath, unifiedLcov, "utf8");
  console.log(
    `Successfully merged ${lcovEntries.length} coverage files into ${mergedLcovPath}`,
  );

  return {
    mergedCount: lcovEntries.length,
    outputPath: mergedLcovPath,
  };
}

if (import.meta.main) {
  collectCoverage().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
