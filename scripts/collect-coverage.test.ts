import path from "node:path";
import { describe, expect, it } from "bun:test";
import { mergeLcovContents, normalizeLcovPaths } from "./collect-coverage";

describe("collect-coverage", () => {
  const repoRoot = path.resolve("test-fixtures/mock-repo");

  describe("normalizeLcovPaths", () => {
    it("normalizes relative SF paths within a workspace directory", () => {
      const input = `
TN:
SF:src/components/button.tsx
DA:1,1
end_of_record
`.trim();

      const normalized = normalizeLcovPaths(
        input,
        path.join(repoRoot, "apps/frontend"),
        repoRoot,
      );

      expect(normalized).toContain(
        "SF:apps/frontend/src/components/button.tsx",
      );
      expect(normalized).not.toContain("SF:src/components/button.tsx");
    });

    it("normalizes absolute SF paths to repo-relative paths", () => {
      const absFilePath = path.join(repoRoot, "packages/core/src/index.ts");
      const input = `
TN:
SF:${absFilePath}
DA:5,3
end_of_record
`.trim();

      const normalized = normalizeLcovPaths(
        input,
        path.join(repoRoot, "packages/core"),
        repoRoot,
      );

      expect(normalized).toContain("SF:packages/core/src/index.ts");
      expect(normalized).not.toContain(repoRoot);
    });

    it("preserves already repo-relative paths", () => {
      const input = `
TN:
SF:scripts/verify-commit-msg.ts
DA:2,1
end_of_record
`.trim();

      const normalized = normalizeLcovPaths(input, repoRoot, repoRoot);

      expect(normalized).toContain("SF:scripts/verify-commit-msg.ts");
    });

    it("supports passing an LcovEntry object directly", () => {
      const entry = {
        baseDir: path.join(repoRoot, "packages/db"),
        content: `SF:src/client.ts\nDA:10,2\nend_of_record`,
      };

      const normalized = normalizeLcovPaths(entry, repoRoot);
      expect(normalized).toContain("SF:packages/db/src/client.ts");
    });
  });

  describe("mergeLcovContents", () => {
    it("combines multiple workspace LCOV contents into a unified string", () => {
      const pkg1 = {
        baseDir: path.join(repoRoot, "packages/core"),
        content: `SF:src/index.ts\nDA:1,1\nend_of_record`,
      };
      const pkg2 = {
        baseDir: path.join(repoRoot, "apps/frontend"),
        content: `SF:src/app.tsx\nDA:2,4\nend_of_record`,
      };

      const merged = mergeLcovContents([pkg1, pkg2], repoRoot);

      expect(merged).toContain("SF:packages/core/src/index.ts");
      expect(merged).toContain("SF:apps/frontend/src/app.tsx");
      expect(merged.endsWith("\n")).toBe(true);
    });

    it("handles empty array or empty content gracefully", () => {
      const merged = mergeLcovContents([], repoRoot);
      expect(merged).toBe("");
    });
  });
});
