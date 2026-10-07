import { describe, expect, it } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeSkillFolderHash, verifySkillsLock } from "./verify-skills-lock";

describe("computeSkillFolderHash", () => {
  it("computes deterministic hash matching known skills-lock.json entry", async () => {
    const hash = await computeSkillFolderHash(".agents/skills/ask-matt");
    expect(hash).toBe(
      "0cd14026efa0330083cbc7adf590976c162b60e02f696a8dcce96f0b4dab8a72",
    );
  });

  it("sorts files deterministically and hashes relative paths with contents", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "skill-hash-test-"));
    try {
      await writeFile(join(testDir, "SKILL.md"), "# Test Skill\n");
      await mkdir(join(testDir, "sub"));
      await writeFile(join(testDir, "sub", "helper.txt"), "hello world\n");

      const hash1 = await computeSkillFolderHash(testDir);
      const hash2 = await computeSkillFolderHash(testDir);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("ignores .git and node_modules directories", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "skill-ignore-test-"));
    try {
      await writeFile(join(testDir, "SKILL.md"), "# Test Skill\n");
      const baseHash = await computeSkillFolderHash(testDir);

      await mkdir(join(testDir, ".git"));
      await writeFile(join(testDir, ".git", "HEAD"), "ref: refs/heads/main\n");
      await mkdir(join(testDir, "node_modules"));
      await writeFile(
        join(testDir, "node_modules", "dummy.js"),
        "console.log('dummy');\n",
      );

      const hashWithIgnored = await computeSkillFolderHash(testDir);
      expect(hashWithIgnored).toBe(baseHash);
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });
});

describe("verifySkillsLock", () => {
  it("verifies all skills in workspace skills-lock.json successfully", async () => {
    const result = await verifySkillsLock({
      lockFilePath: "skills-lock.json",
      skillsBaseDir: ".agents/skills",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.verifiedCount).toBeGreaterThan(0);
  });

  it("detects hash mismatch when skill content is modified", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "skill-verify-mismatch-"));
    try {
      const skillsDir = join(testDir, ".agents", "skills");
      const sampleSkillDir = join(skillsDir, "sample-skill");
      await mkdir(sampleSkillDir, { recursive: true });
      await writeFile(join(sampleSkillDir, "SKILL.md"), "original content");

      const correctHash = await computeSkillFolderHash(sampleSkillDir);

      const lockFilePath = join(testDir, "skills-lock.json");
      const fakeLock = {
        version: 1,
        skills: {
          "sample-skill": {
            source: "test/repo",
            sourceType: "github",
            skillPath: "sample-skill/SKILL.md",
            computedHash: correctHash,
          },
        },
      };
      await writeFile(lockFilePath, JSON.stringify(fakeLock, null, 2));

      // Initially valid
      const initialCheck = await verifySkillsLock({
        lockFilePath,
        skillsBaseDir: skillsDir,
      });
      expect(initialCheck.valid).toBe(true);

      // Mutate skill
      await writeFile(join(sampleSkillDir, "SKILL.md"), "tampered content");

      const tamperedCheck = await verifySkillsLock({
        lockFilePath,
        skillsBaseDir: skillsDir,
      });
      expect(tamperedCheck.valid).toBe(false);
      expect(tamperedCheck.errors).toHaveLength(1);
      expect(tamperedCheck.errors[0]).toContain("sample-skill");
      expect(tamperedCheck.errors[0]).toContain("Hash mismatch");
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("detects missing skill directory", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "skill-verify-missing-"));
    try {
      const skillsDir = join(testDir, ".agents", "skills");
      await mkdir(skillsDir, { recursive: true });

      const lockFilePath = join(testDir, "skills-lock.json");
      const fakeLock = {
        version: 1,
        skills: {
          "missing-skill": {
            source: "test/repo",
            sourceType: "github",
            skillPath: "missing-skill/SKILL.md",
            computedHash:
              "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
          },
        },
      };
      await writeFile(lockFilePath, JSON.stringify(fakeLock, null, 2));

      const check = await verifySkillsLock({
        lockFilePath,
        skillsBaseDir: skillsDir,
      });
      expect(check.valid).toBe(false);
      expect(check.errors).toHaveLength(1);
      expect(check.errors[0]).toContain("missing-skill");
      expect(check.errors[0]).toContain("Directory does not exist");
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("detects untracked skill directory on disk not listed in lockfile", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "skill-verify-untracked-"));
    try {
      const skillsDir = join(testDir, ".agents", "skills");
      const rogueSkillDir = join(skillsDir, "rogue-skill");
      await mkdir(rogueSkillDir, { recursive: true });
      await writeFile(join(rogueSkillDir, "SKILL.md"), "injected rogue skill");

      const lockFilePath = join(testDir, "skills-lock.json");
      const fakeLock = {
        version: 1,
        skills: {},
      };
      await writeFile(lockFilePath, JSON.stringify(fakeLock, null, 2));

      const check = await verifySkillsLock({
        lockFilePath,
        skillsBaseDir: skillsDir,
        allowedLocalSkills: [],
      });
      expect(check.valid).toBe(false);
      expect(check.errors).toHaveLength(1);
      expect(check.errors[0]).toContain("rogue-skill");
      expect(check.errors[0]).toContain(
        "Untracked skill directory found on disk",
      );
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });
});
