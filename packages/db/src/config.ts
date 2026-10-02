import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export interface DatabaseConfig {
  path: string;
  isMemory: boolean;
}

/**
 * Ensures the parent directory of the database file exists.
 * bun:sqlite throws SQLITE_CANTOPEN if parent directory is missing.
 */
function ensureParentDirectory(filePath: string): string {
  if (filePath === ":memory:") return filePath;
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return filePath;
}

/**
 * Resolves the database file path based on environment variables and execution context.
 */
export function resolveDatabasePath(customPath?: string): string {
  // 1. Explicit override via argument or environment variable
  const envPath =
    customPath ?? process.env.DEVTOOLS_DB_PATH ?? process.env.DATABASE_URL;
  if (envPath) {
    if (envPath === ":memory:") return ":memory:";
    return ensureParentDirectory(resolve(process.cwd(), envPath));
  }

  // 2. Automated test environment
  if (process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test") {
    return ":memory:";
  }

  // 3. Local Development (Django-style in-repo database)
  if (process.env.NODE_ENV !== "production") {
    const devDbPath = resolve(process.cwd(), ".devtools", "devtools.db");
    return ensureParentDirectory(devDbPath);
  }

  // 4. Production default: User's home directory (~/.devtools/devtools.db)
  const prodDbPath = join(homedir(), ".devtools", "devtools.db");
  return ensureParentDirectory(prodDbPath);
}
