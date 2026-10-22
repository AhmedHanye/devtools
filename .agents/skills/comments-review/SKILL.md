---
name: comments-review
description: Review unresolved pull request comments from humans and bots. Use when asked to review PR comments, triage review feedback, or inspect comments on an open pull request.
---

# Review pull request comments

Triage unresolved review threads on an open pull request against repository truth: ADRs, glossaries, diffs, and codebase files. Sort findings into four dispositions and run grilling on ambiguous trade-offs.

Read `CONTRIBUTING.md` for git and pull request workflows, command patterns, and review thread resolution.

## Process

### 1. Pin the pull request

- Use the pull request number from the prompt if provided.
- If omitted, infer from the current branch via `gh pr view` or prompt the user.
- Verify the pull request is open. Stop if closed or merged.

### 2. Fetch unresolved review threads

- Run the GraphQL query for review thread resolution to extract unresolved threads, diff positions, authors, and comments.
- Completion criterion: The query returns unresolved threads. If zero unresolved threads exist, report that all threads are resolved and stop.

### 3. Assemble repository truth

Collect baseline context:
- Pull request diff: inspect via `gh pr diff`.
- Originating spec or issue: locate via `Closes #<issue>` in the pull request description or inspect linked issues.
- Architectural decisions: read `GLOSSARY-MAP.md` and active records under `docs/adr/`.
- Domain glossaries: read `GLOSSARY-MAP.md` and active context files under `docs/glossary/`.
- Commit history: inspect commits on the branch against `main`.

### 4. Dispatch triage subagent

Run a dedicated subagent to evaluate threads without polluting the main session context.

Subagent prompt must include:
- Unresolved threads from step 2.
- Pull request diff and commit list.
- Context pointers to `docs/adr/` and `docs/glossary/`.
- Classification rules:
  - Treat every comment as an unverified opinion.
  - Verify claims against diff hunks, file contents, ADRs, and glossaries.
  - Assign each thread to one disposition:
    - **Valid defect**: A verified bug or contract breach. Report file path, line number, thread ID, failure mode, and recommended code fix.
    - **False positive**: An invalid claim contradicted by ADRs, glossaries, or code. Report thread ID, refutation citing specific files, and a polite technical reply.
    - **Ignorable suggestion**: A non-binding stylistic preference or out-of-scope idea. Report thread ID and reason for dismissal.
    - **Candidate for grilling**: An ambiguous trade-off or architectural choice where developer intent must decide. Report thread ID, competing options, and trade-offs.
  - Structure the report under these four headings.

Completion criterion: A markdown report categorizing every unresolved thread under one of the four headings.

### 5. Evaluate report and grill on candidates

Inspect the subagent report:

- When `Candidates for grilling` contains items:
  1. Start a grilling session following `.agents/skills/grilling`.
  2. Write `grilling_round_1_pr_comments.md` in the session artifact directory with questions covering only candidate trade-offs.
  3. Word each question so "yes" accepts the recommended answer.
  4. Point the user to the artifact and wait for answers.
  5. Work the decision tree until the frontier is empty.
  6. Present the summary artifact of settled decisions.
- When `Candidates for grilling` is empty:
  - Present the report directly with recommended actions for valid defects, false positives, and ignorable suggestions.

### 6. Resolve threads

Wait for explicit user confirmation before modifying files or resolving threads on GitHub.

Following confirmation:
- Apply code fixes for valid defects, run verification tests, and commit.
- Post comment replies and resolve threads using the GraphQL mutation.
- For ambiguous findings requiring maintainer input, leave the thread open and report the trade-off to the user.
