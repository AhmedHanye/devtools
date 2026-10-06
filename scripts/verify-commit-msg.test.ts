import { describe, expect, it } from "bun:test";
import { validateCommitMessage } from "./verify-commit-msg";

describe("validateCommitMessage", () => {
  it("accepts valid conventional commit messages with scope", () => {
    expect(
      validateCommitMessage("feat(server): add initial health check endpoint")
        .valid,
    ).toBe(true);
    expect(
      validateCommitMessage(
        "fix(web): resolve layout shift on mobile viewports",
      ).valid,
    ).toBe(true);
    expect(
      validateCommitMessage("chore(ci): update workflow dependencies").valid,
    ).toBe(true);
  });

  it("accepts valid conventional commit messages without scope", () => {
    expect(validateCommitMessage("feat: add new feature").valid).toBe(true);
    expect(validateCommitMessage("fix: resolve null pointer").valid).toBe(true);
    expect(validateCommitMessage("docs: update readme").valid).toBe(true);
  });

  it("accepts breaking change exclamation marks", () => {
    expect(
      validateCommitMessage("feat(api)!: drop deprecated endpoints").valid,
    ).toBe(true);
    expect(validateCommitMessage("refactor!: rewrite core router").valid).toBe(
      true,
    );
  });

  it("accepts automatic git merge commits", () => {
    expect(
      validateCommitMessage("Merge branch 'main' into feature").valid,
    ).toBe(true);
    expect(
      validateCommitMessage("Merge pull request #12 from branch").valid,
    ).toBe(true);
  });

  it("rejects commit subjects containing PR/issue references per CONTRIBUTING.md", () => {
    const result = validateCommitMessage(
      "feat(server): add initial health check endpoint (#123)",
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("issue reference");
  });

  it("rejects non-conventional commit messages", () => {
    expect(validateCommitMessage("added stuff").valid).toBe(false);
    expect(validateCommitMessage("WIP: testing").valid).toBe(false);
    expect(validateCommitMessage("update readme").valid).toBe(false);
    expect(validateCommitMessage("FIX: typo").valid).toBe(false);
  });

  it("ignores git comment lines and whitespace", () => {
    const multiLine = `# Please enter the commit message for your changes.
# Lines starting with '#' will be ignored.

feat(db): add users table schema

Detailed description here...
`;
    expect(validateCommitMessage(multiLine).valid).toBe(true);
  });
});
