---
name: evaluate-pr
description: Evaluate whether a pull request should be merged or investigated based on CI checks, review threads, blast radius, and repository standards.
disable-model-invocation: true
---

# Evaluate pull request

Evaluate a pull request to determine whether it is ready to squash merge into `main` or requires further investigation.

Run this skill when invoked with `/evaluate-pr <number-or-url>`.

## Operational constraints

1. **Read-only evaluation.** Do not modify files, make commits, run code edits, or execute GraphQL mutations.
2. **Zero branch checkout.** Do not switch local git branches (`git checkout`, `gh pr checkout`). Inspect remote state exclusively using `gh` CLI commands and read-only git queries against fetched refs.

## Evaluation workflow

### 1. Resolve pull request and extract metadata

Identify the pull request number from the input argument (`<number-or-url>`). Extract the PR title, author, branch, base, description, labels, and state:

```bash
PR_TARGET="<number-or-url>"
gh pr view "$PR_TARGET" --json number,title,author,headRefName,baseRefName,body,labels,isDraft,state,url
```

Verify that the pull request is open and not in draft status. If closed or draft, record this immediately in the evaluation report.

### 2. Inspect remote CI checks and failure logs

Check the status of automated CI checks:

```bash
gh pr checks "$PR_TARGET"
```

If any check is failing or cancelled:
1. Locate the failing check run ID or URL.
2. Fetch the failure log to extract the specific failing test, compilation error, or lint failure:

```bash
gh run view <run-id> --log-failed
```

Summarize the failure reason concisely under findings.

### 3. Check review thread resolution

Repository ruleset `#24154563` enforces `required_review_thread_resolution: true`. Query the GitHub GraphQL API to verify that all comment threads from human reviewers and review bots (such as CodeRabbit) are marked resolved:

```bash
gh api graphql -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              body
              author { login }
            }
          }
        }
      }
    }
  }
}' -F owner=':owner' -F repo=':repo' -F pr=<pr_number>
```

Identify any threads where `isResolved` is false. Extract the comment author and the open concern.

### 4. Analyze diff blast radius and architectural boundaries

Inspect the modified files and diffstat:

```bash
gh pr diff "$PR_TARGET" --stat
gh pr diff "$PR_TARGET"
```

Evaluate the diff against repository standards:
- **Blast radius:** Map modified paths across workspaces (`apps/*`, `packages/*`, `.github/*`, `.agents/*`, scripts).
- **Workspace dependency boundaries:** Verify that changes to `package.json` follow `.agents/rules/dependencies.md`. Ensure no phantom dependencies resolve through hoisting and no application runtime packages are added to the workspace root.
- **Frontend architectural boundaries:** If `apps/frontend/` is modified, verify compliance with `.agents/rules/frontend.md` (Feature-Sliced Design layers, index exports, semantic theme tokens, no client-only globals accessed unsafely).
- **Secret leak prevention:** Ensure zero production secrets, real API keys, or unsuppressed synthetic keys are committed (`.agents/rules/secrets.md`).
- **Cleanliness:** Confirm zero ephemeral files, scratch logs, or workspace `tmp/` / `.scratch/` paths are checked into git or referenced in the pull request description.

### 5. Validate PR template, evidence, and commits

1. **Pull request description:** Verify that the body follows `.github/PULL_REQUEST_TEMPLATE.md`:
   - Summary includes a structural view (shallow file tree, component tree, or diff sketch).
   - Closing issue link is present (`Closes #<issue>`).
   - Observable verification evidence is included (terminal output, test passes, or before/after visual proof).
   - Merge Danger section specifies Door type (`one-way` or `two-way`) and Blast Radius.
2. **Commit conventions:** Verify commit messages match Conventional Commits (`type(scope): description`) without issue references in commit subjects.

## Output format

Generate an executive evaluation report following this exact structure:

```markdown
# Pull request evaluation: #<number> - <title>

**Author:** @<author> | **Branch:** `<head-branch>` -> `<base-branch>` | **URL:** <pr-url>

## 1. Metadata and blast radius
- **Door:** <one-way or two-way>
- **Blast radius:** <concise scope description>
- **Modified workspaces:** <list of impacted apps/packages/infra>

## 2. What looks good
- <List passed CI checks, clean boundaries, and satisfied standards>

## 3. What needs attention
- <List failing checks with log snippets, unresolved review threads, missing evidence, or standards violations>
- <If everything passed cleanly, state "No blockers or defects identified.">

## 4. Manual verification checklist
- [ ] <Specific behavioral test, visual inspection, or migration check required>
- [ ] Visual and structural inspection: Run `/show-me` to inspect component trees, state sketches, or file layout diffs for modified paths.
<!-- If no manual steps are required, state "No manual verification required. Automated CI evidence is complete." -->

## 5. Evaluation verdict
**Verdict:** MERGE
<!-- or -->
**Verdict:** INVESTIGATE
```

## Verdict determination rules

1. **MERGE:** Assign strictly when:
   - All CI checks pass (`gh pr checks` is all green).
   - All review threads are resolved (`isResolved: true`).
   - Repository standards and boundaries are fully met.
   - Observable verification evidence in the PR body is complete.
   - No manual verification, visual checks, or human investigations are required.

2. **INVESTIGATE:** Assign whenever:
   - Any CI check is failing, pending, or cancelled.
   - Any review thread remains unresolved.
   - The PR description lacks required template sections or verification evidence.
   - Architectural boundaries, dependency rules, or secret invariants are violated.
   - Manual verification is required (such as unverified UI changes, breaking changes, or schema migrations).
