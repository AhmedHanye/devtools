# Pull Requests and Code Review

Guidelines for creating, reviewing, resolving threads, and merging pull requests.

## Triage and Inspection

External pull requests are not treated as feature requests. New capabilities must begin as issues.

When inspecting pull requests:

- **Read a PR**: `gh pr view <number> --json number,title,body,labels,comments` and `gh pr diff <number>` for the diff.
- **List PRs**: `gh pr list --state open --json number,title,body,labels,author,comments`

### GitHub CLI Operational Notes

- **File-filtered PR diffs**: `gh pr diff <number>` does not accept path arguments. To inspect specific files on a PR branch, run `git diff origin/main...HEAD -- <path>`.
- **Check run exit codes**: `gh pr checks <number>` exits with code `8` when CI checks are pending or in progress; use `gh pr checks <number> --watch` to await completion.

## Pull Request Rules

1. **Link the tracking issue:** `gh issue develop` links the issue automatically. If created manually, add `Closes #<issue>` to the pull request body.
2. **Self-assign the pull request:** Always self-assign as the Directly Responsible Individual (DRI) when opening a pull request by passing `--assignee "@me"` (maintainer review is automatically requested via `CODEOWNERS`).
3. **Follow the pull request structure:** PR descriptions must describe user-facing changes to `main` following `.github/PULL_REQUEST_TEMPLATE.md` (Summary with structural diff/tree, Evidence, and Merge Danger). Pull request descriptions cite permanent codebase paths and omit ephemeral workspace `.scratch/` paths, raw session logs, and agent execution notes.
4. **Provide verification evidence:** Include terminal test output, commands, or observable behavior confirming all acceptance criteria.
5. **Audit tracking issue checklist and instructions:** Before opening the pull request, inspect the linked issue/ticket description (`gh issue view <ticket_number>`). Check off all completed acceptance criteria (`- [x]`) and update any outdated instructions, commands, or scope definitions that evolved during implementation.
6. **Open the pull request and update status.** Create the pull request, then transition the tracking issue to `In Review` in GitHub Project #8:
   ```bash
   gh pr create --assignee "@me"
   ITEM_ID=$(gh project item-add 8 --owner AhmedHanye --url "https://github.com/AhmedHanye/devtools/issues/<ticket_number>" --format json --jq .id)
   gh project item-edit --id "$ITEM_ID" --project-id "PVT_kwHOBtOqTs4BlBUk" --field-id "PVTSSF_lAHOBtOqTs4BlBUkzhjvvg4" --single-select-option-id "27903ead"
   ```

## Review Thread Resolution

Repository ruleset `#24154563` (`Protect Main Branch`) enforces `required_review_thread_resolution: true`. All comment threads opened by reviewers or automated review bots (such as CodeRabbit) must be addressed before merge eligibility.

### 1. Inspect unresolved review threads

Query open review threads, diff locations, authors, and conversation nodes via GitHub GraphQL:

```bash
gh api graphql -F owner=':owner' -F repo=':repo' -F pr=<pr_number> -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 50) {
              nodes {
                id
                author { login }
                body
                createdAt
              }
            }
          }
        }
      }
    }
  }' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

### 2. Resolution workflows

- **Valid defect:** Implement the code fix, confirm tests pass, post a comment referencing the fix commit, and resolve the thread via GitHub GraphQL:
  ```bash
  gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<thread_node_id>"}) { clientMutationId } }'
  ```
- **False positive / Hallucination:** Post a technical comment detailing why the remark is invalid or contradicts repo design, and resolve the thread via GraphQL.
- **Ambiguous or high-risk finding:** Leave the thread unresolved and escalate to the maintainer.

## Merging Pull Requests

Squash merge into `main` after all review threads and status checks pass:

```bash
gh pr merge <pr_number> --squash --delete-branch
```

Linear history with squash merging is enforced by repository rulesets.
