import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDb,
  createSqliteConnection,
  eq,
  getDb,
  integer,
  resetDb,
  resolveDatabasePath,
  runMigrations,
  sql,
  sqliteTable,
  systemMetadata,
  text,
} from "../src";

describe("Database Configuration & Path Resolution", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves to :memory: in test environment by default", () => {
    process.env.NODE_ENV = "test";
    expect(resolveDatabasePath()).toBe(":memory:");
  });

  it("respects explicit custom path argument", () => {
    const tempPath = join(tmpdir(), "devtools-test", "custom.db");
    try {
      const resolved = resolveDatabasePath(tempPath);
      expect(resolved).toBe(tempPath);
      expect(existsSync(join(tmpdir(), "devtools-test"))).toBe(true);
    } finally {
      rmSync(join(tmpdir(), "devtools-test"), { recursive: true, force: true });
    }
  });

  it("respects DEVTOOLS_DB_PATH environment variable override", () => {
    const tempPath = join(tmpdir(), "devtools-env-test", "env.db");
    process.env.DEVTOOLS_DB_PATH = tempPath;
    try {
      const resolved = resolveDatabasePath();
      expect(resolved).toBe(tempPath);
      expect(existsSync(join(tmpdir(), "devtools-env-test"))).toBe(true);
    } finally {
      rmSync(join(tmpdir(), "devtools-env-test"), {
        recursive: true,
        force: true,
      });
    }
  });

  it("returns :memory: if DEVTOOLS_DB_PATH is :memory:", () => {
    process.env.DEVTOOLS_DB_PATH = ":memory:";
    expect(resolveDatabasePath()).toBe(":memory:");
  });

  it("resolves to in-repo .devtools/devtools.db in development environment", () => {
    delete process.env.DEVTOOLS_DB_PATH;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "development";
    delete process.env.BUN_ENV;

    const resolved = resolveDatabasePath();
    expect(resolved).toContain(".devtools");
    expect(resolved.endsWith("devtools.db")).toBe(true);
  });
});

describe("SQLite Connection & Concurrency PRAGMAs", () => {
  it("initializes an in-memory connection with correct PRAGMAs", () => {
    const conn = createSqliteConnection(":memory:");
    try {
      const busyTimeout = conn.query("PRAGMA busy_timeout;").get() as {
        timeout: number;
      };
      expect(busyTimeout.timeout).toBe(5000);

      const foreignKeys = conn.query("PRAGMA foreign_keys;").get() as {
        foreign_keys: number;
      };
      expect(foreignKeys.foreign_keys).toBe(1);

      const synchronous = conn.query("PRAGMA synchronous;").get() as {
        synchronous: number;
      };
      expect(synchronous.synchronous).toBe(1); // 1 = NORMAL
    } finally {
      conn.close();
    }
  });

  it("enables WAL mode on file-backed connections", () => {
    const tempDbPath = join(tmpdir(), `test-wal-${Date.now()}.db`);
    try {
      const conn = createSqliteConnection(tempDbPath);
      try {
        const journalMode = conn.query("PRAGMA journal_mode;").get() as {
          journal_mode: string;
        };
        expect(journalMode.journal_mode.toLowerCase()).toBe("wal");
      } finally {
        conn.close();
      }
    } finally {
      rmSync(tempDbPath, { force: true });
      rmSync(`${tempDbPath}-wal`, { force: true });
      rmSync(`${tempDbPath}-shm`, { force: true });
    }
  });
});

describe("Migrations & Database Client Operations", () => {
  it("applies migrations programmatically and performs CRUD operations", async () => {
    const testDb = createDb({ path: ":memory:" });

    // Run programmatic migrations
    runMigrations(testDb);

    // Verify system_metadata table created and works
    const now = new Date();
    testDb
      .insert(systemMetadata)
      .values({
        key: "version",
        value: "1.0.0",
        updatedAt: now,
      })
      .run();

    // Verify query via await
    const result = await testDb.query.systemMetadata.findFirst({
      where: eq(systemMetadata.key, "version"),
    });

    expect(result).toBeDefined();
    expect(result?.key).toBe("version");
    expect(result?.value).toBe("1.0.0");
    expect(result?.updatedAt instanceof Date).toBe(true);

    // Verify query via .sync()
    const syncResult = testDb.query.systemMetadata
      .findFirst({
        where: eq(systemMetadata.key, "version"),
      })
      .sync();
    expect(syncResult?.value).toBe("1.0.0");

    // Update
    testDb
      .update(systemMetadata)
      .set({ value: "2.0.0" })
      .where(eq(systemMetadata.key, "version"))
      .run();

    const updated = await testDb.query.systemMetadata.findFirst({
      where: eq(systemMetadata.key, "version"),
    });
    expect(updated?.value).toBe("2.0.0");

    // Delete
    testDb
      .delete(systemMetadata)
      .where(eq(systemMetadata.key, "version"))
      .run();

    const deleted = await testDb.query.systemMetadata.findFirst({
      where: eq(systemMetadata.key, "version"),
    });
    expect(deleted).toBeUndefined();
  });

  it("supports getDb() singleton and resetDb()", () => {
    resetDb();
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
    resetDb();
  });
});

describe("Re-exported Primitives & Operators", () => {
  it("exports essential Drizzle schema primitives and query operators", () => {
    expect(typeof sqliteTable).toBe("function");
    expect(typeof text).toBe("function");
    expect(typeof integer).toBe("function");
    expect(typeof eq).toBe("function");
    expect(typeof sql).toBe("function");
  });
});
