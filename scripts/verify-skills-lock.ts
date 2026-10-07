import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface SkillLockEntry {
  source?: string | null;
  sourceType?: string | null;
  skillPath?: string;
  computedHash: string;
}

export interface SkillsLockFile {
  version: number;
  skills: Record<string, SkillLockEntry>;
}

export interface VerifySkillsLockResult {
  valid: boolean;
  errors: string[];
  verifiedCount: number;
}

async function collectFiles(
  baseDir: string,
  currentDir: string,
  results: Array<{ relativePath: string; content: Buffer }>,
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") return;
        await collectFiles(baseDir, fullPath, results);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath);
        const relativePath = relative(baseDir, fullPath).split("\\").join("/");
        results.push({ relativePath, content });
      }
    }),
  );
}

export async function computeSkillFolderHash(
  skillDir: string,
): Promise<string> {
  const files: Array<{ relativePath: string; content: Buffer }> = [];
  await collectFiles(skillDir, skillDir, files);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest("hex");
}

export async function verifySkillsLock(options?: {
  lockFilePath?: string;
  skillsBaseDir?: string;
  allowedLocalSkills?: string[];
}): Promise<VerifySkillsLockResult> {
  const lockFilePath = options?.lockFilePath ?? "skills-lock.json";
  const skillsBaseDir = options?.skillsBaseDir ?? ".agents/skills";

  let lockRaw: string;
  try {
    lockRaw = await readFile(lockFilePath, "utf-8");
  } catch (err) {
    return {
      valid: false,
      errors: [
        `Failed to read lockfile at ${lockFilePath}: ${(err as Error).message}`,
      ],
      verifiedCount: 0,
    };
  }

  let lock: SkillsLockFile;
  try {
    lock = JSON.parse(lockRaw) as SkillsLockFile;
  } catch (err) {
    return {
      valid: false,
      errors: [
        `Failed to parse lockfile JSON at ${lockFilePath}: ${(err as Error).message}`,
      ],
      verifiedCount: 0,
    };
  }

  const errors: string[] = [];
  let verifiedCount = 0;
  const allowedLocalSkills = new Set(
    options?.allowedLocalSkills ?? ["github-actions"],
  );

  // 1. Check that all locked skills exist on disk and match their computed hashes
  for (const [name, entry] of Object.entries(lock.skills)) {
    const skillDir = join(skillsBaseDir, name);

    try {
      const stats = await stat(skillDir);
      if (!stats.isDirectory()) {
        errors.push(`Skill '${name}': Path is not a directory (${skillDir})`);
        continue;
      }
    } catch {
      errors.push(`Skill '${name}': Directory does not exist (${skillDir})`);
      continue;
    }

    try {
      const computedHash = await computeSkillFolderHash(skillDir);
      if (computedHash !== entry.computedHash) {
        errors.push(
          `Skill '${name}': Hash mismatch! Expected ${entry.computedHash}, calculated ${computedHash}`,
        );
      } else {
        verifiedCount++;
      }
    } catch (err) {
      errors.push(
        `Skill '${name}': Error calculating hash: ${(err as Error).message}`,
      );
    }
  }

  // 2. Check that all skill directories on disk are accounted for in lockfile or allowed local set
  try {
    const diskEntries = await readdir(skillsBaseDir, { withFileTypes: true });
    for (const diskEntry of diskEntries) {
      if (diskEntry.isDirectory()) {
        const skillName = diskEntry.name;
        if (!lock.skills[skillName] && !allowedLocalSkills.has(skillName)) {
          errors.push(
            `Skill '${skillName}': Untracked skill directory found on disk that is not locked in ${lockFilePath}`,
          );
        }
      }
    }
  } catch (err) {
    errors.push(
      `Failed to read skills directory at ${skillsBaseDir}: ${(err as Error).message}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    verifiedCount,
  };
}

async function run(): Promise<void> {
  console.log("🔒 Verifying skills integrity against skills-lock.json...");
  const result = await verifySkillsLock();

  if (!result.valid) {
    console.error(
      `\n❌ Skills integrity verification failed with ${result.errors.length} error(s):`,
    );
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    console.error("\nSkills in .agents/skills/ are immutable locked assets.");
    console.error(
      "Tampering with locked skills is rejected to protect against prompt injection.",
    );
    process.exit(1);
  }

  console.log(
    `✅ All ${result.verifiedCount} locked skills verified successfully against skills-lock.json.`,
  );
}

if (import.meta.main) {
  run();
}
