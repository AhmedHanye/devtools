import { readFileSync } from "node:fs";
import { extname } from "node:path";

interface SecretRule {
  name: string;
  regex: RegExp;
}

const SECRET_PATTERNS: SecretRule[] = [
  {
    name: "AWS Access Key ID",
    regex: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/,
  },
  {
    name: "GitHub Personal Access Token",
    regex: /(?:^|[^a-zA-Z0-9_])(ghp_[0-9a-zA-Z]{36})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "GitHub OAuth / Server Token",
    regex: /(?:^|[^a-zA-Z0-9_])(gh[ousr]_[0-9a-zA-Z]{36})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "GitHub Fine-Grained PAT",
    regex:
      /(?:^|[^a-zA-Z0-9_])(github_pat_[0-9a-zA-Z_]{82})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "Slack Token",
    regex:
      /(?:^|[^a-zA-Z0-9_])(xox[baprs]-[0-9a-zA-Z]{10,48})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "OpenAI API Key",
    regex:
      /(?:^|[^a-zA-Z0-9_])(sk-(?:proj-|live-)?[a-zA-Z0-9_-]{32,})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "Stripe API Key",
    regex:
      /(?:^|[^a-zA-Z0-9_])((?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,})(?:[^a-zA-Z0-9_]|$)/,
  },
  {
    name: "Private Key",
    regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/,
  },
];

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".tar",
  ".gz",
  ".lockb",
]);

export interface Finding {
  file: string;
  line: number;
  rule: string;
  token: string;
}

export function isIgnoredLine(line: string): boolean {
  return /trufflehog:ignore/i.test(line);
}

export function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return "*".repeat(secret.length);
  }
  const prefixLength = Math.min(6, Math.floor(secret.length / 3));
  return (
    secret.slice(0, prefixLength) + "*".repeat(secret.length - prefixLength)
  );
}

function isSyntheticPlaceholder(token: string): boolean {
  if (token.startsWith("mock_") || /^0+$/.test(token)) {
    return true;
  }
  return false;
}

export function scanContentForSecrets(
  content: string,
  filePath = "unknown",
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isIgnoredLine(line)) {
      continue;
    }

    for (const pattern of SECRET_PATTERNS) {
      const match = pattern.regex.exec(line);
      if (match) {
        const token = match[1] ?? match[0];
        if (isSyntheticPlaceholder(token)) {
          continue;
        }

        findings.push({
          file: filePath,
          line: i + 1,
          rule: pattern.name,
          token,
        });
      }
    }
  }

  return findings;
}

function getStagedFiles(): string[] {
  try {
    const proc = Bun.spawnSync([
      "git",
      "diff",
      "--name-only",
      "--cached",
      "--diff-filter=d",
    ]);
    if (proc.exitCode !== 0) {
      return [];
    }
    const output = proc.stdout.toString().trim();
    if (!output) {
      return [];
    }
    return output
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function sanitizeFileText(text: string): string | null {
  if (text.includes("\0")) {
    return null;
  }
  return text;
}

function readStagedContent(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return null;
  }

  try {
    const proc = Bun.spawnSync(["git", "show", `:${filePath}`]);
    if (proc.exitCode === 0) {
      return sanitizeFileText(proc.stdout.toString());
    }
  } catch {
    // Fall back to disk read
  }

  try {
    return sanitizeFileText(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function run(): void {
  const startTime = performance.now();
  const cliArgs = process.argv.slice(2);
  const filesToScan = cliArgs.length > 0 ? cliArgs : getStagedFiles();

  if (filesToScan.length === 0) {
    console.log("🔍 No staged files to scan for secrets.");
    return;
  }

  const allFindings: Finding[] = [];
  let scannedCount = 0;

  for (const file of filesToScan) {
    const content = readStagedContent(file);
    if (content === null) {
      continue;
    }
    scannedCount++;
    const findings = scanContentForSecrets(content, file);
    allFindings.push(...findings);
  }

  const elapsed = (performance.now() - startTime).toFixed(1);

  if (allFindings.length > 0) {
    console.error(
      `\n❌ Secret Detection Failure: Found ${allFindings.length} suspected secret(s) across staged files:\n`,
    );
    for (const f of allFindings) {
      console.error(
        `  - ${f.file}:${f.line} [${f.rule}] ${maskSecret(f.token)}`,
      );
    }
    console.error(
      "\nTo resolve:\n" +
        "1. Remove real credentials immediately and rotate compromised keys.\n" +
        "2. For synthetic unit test fixtures or mock keys, append `// trufflehog:ignore`\n" +
        "   or `# trufflehog:ignore` to the line per .agents/rules/secrets.md.\n",
    );
    process.exit(1);
  }

  console.log(
    `✅ Staged secret scan passed (${scannedCount} file(s) checked in ${elapsed}ms).`,
  );
}

if (import.meta.main) {
  run();
}
