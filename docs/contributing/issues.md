# Issue Tracking and Management

Guidelines for GitHub Issues, Spec/Ticket hierarchy, GitHub Project #8 status lifecycle, and linked branch workflows.

## Issue CLI Commands

Issues and specs live as GitHub issues. Use the `gh` CLI for all operations. The repository is inferred from `git remote -v`.

GitHub shares one number space across issues and pull requests. When inspecting a reference, resolve the number with `gh pr view <number>` first, then fall back to `gh issue view <number>`.

- **Create an issue**: `gh issue create --title "..." --body "..."` (use a heredoc for multi-line bodies).
- **Create a Spec issue**: `gh issue create --title "[Spec]: <title>" --label "type:spec" --milestone "<milestone>" --body "..."`
- **Create a Ticket issue**: `gh issue create --title "[Slice]: <title>" --label "type:feat" --body "..."`
- **Search issues by title**: `gh issue list --search "<title>" --json number --jq '.[0].number'`
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,state,comments` (always specify `--json` to avoid deprecated GraphQL queries).
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Edit labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

## Hierarchy and Dependencies

The project organizes work into Specs and Tickets:

- **Specs** track milestone capabilities.
- **Tickets** deliver atomic vertical slices that can stand alone or link to a parent Spec as sub-issues.

### Query and Link Hierarchy

- **Inspect sub-issues:** Query existing sub-issues for a parent issue:
  ```bash
  gh api --paginate repos/{owner}/{repo}/issues/<number>/sub_issues --jq '.[] | {number: .number, title: .title, state: .state}'
  ```
- **Attach ticket to parent Spec:** Link a child ticket:
  ```bash
  gh api --method POST repos/{owner}/{repo}/issues/<spec_number>/sub_issues \
    -F sub_issue_id=<ticket_db_id>
  ```
  Use capital `-F` to pass the database ID as a typed integer. Lowercase `-f` passes a string value and fails with `422 Unprocessable Entity`.
- **Add dependency:** Declare a blocking relationship:
  ```bash
  gh api --method POST repos/{owner}/{repo}/issues/<ticket_number>/dependencies/blocked_by \
    -F issue_id=<blocker_db_id>
  ```
- **Resolve database ID:** Look up numeric database ID:
  ```bash
  gh api repos/{owner}/{repo}/issues/<number> --jq .id
  ```
- **Resolve parent Spec:** Look up the parent Spec number for a ticket:
  ```bash
  gh api repos/{owner}/{repo}/issues/<ticket_number>/parent --jq .number 2>/dev/null
  ```
- **Single source of truth:** Omit manual parent links, child checklists, and `Blocked by: #...` lines from markdown bodies when native issue hierarchy and dependencies are enabled.
- **Milestones:** Assigned strictly to Specs to track milestone deliverables without metric dilution. Tickets do not receive milestones. Query active milestone titles:
  ```bash
  gh api --paginate repos/{owner}/{repo}/milestones --jq '.[].title'
  ```
- **Query frontier:** List open tickets with zero unresolved blockers and no DRI.

## Project Board Status Lifecycle

Status is tracked on GitHub Project #8 (`Todo`, `In Progress`, `In Review`, `Done`). `Done` transitions are handled automatically on PR merge. Repository `status:*` labels are not used.

Project #8 identifiers:

- Owner: `AhmedHanye`
- Project ID: `PVT_kwHOBtOqTs4BlBUk`
- Status Field ID: `PVTSSF_lAHOBtOqTs4BlBUkzhjvvg4`
- Status Option IDs: `Todo` (`2ed95dcd`), `In Progress` (`47fc9ee4`), `In Review` (`27903ead`), `Done` (`98236657`)

Ensure the token has the `project` scope before running project commands. Run `gh auth refresh -s project` if the scope is missing.

To update status on Project #8:

```bash
ITEM_ID=$(gh project item-add 8 --owner AhmedHanye --url "https://github.com/AhmedHanye/devtools/issues/<issue_number>" --format json --jq .id)
gh project item-edit --id "$ITEM_ID" --project-id "PVT_kwHOBtOqTs4BlBUk" --field-id "PVTSSF_lAHOBtOqTs4BlBUkzhjvvg4" --single-select-option-id "<option_id>"
```

### Claiming a Ticket and Branch Checkout

Before branching:

1. Verify a clean working tree:
   ```bash
   git status --porcelain
   ```
2. Update local `main`:
   ```bash
   git checkout main && git pull origin main
   ```
3. Assign `@me`, create the native linked branch, and transition the ticket to `In Progress` in GitHub Project #8:
   ```bash
   gh issue edit <ticket_number> --add-assignee @me
   gh issue develop <ticket_number> --checkout
   ITEM_ID=$(gh project item-add 8 --owner AhmedHanye --url "https://github.com/AhmedHanye/devtools/issues/<ticket_number>" --format json --jq .id)
   gh project item-edit --id "$ITEM_ID" --project-id "PVT_kwHOBtOqTs4BlBUk" --field-id "PVTSSF_lAHOBtOqTs4BlBUkzhjvvg4" --single-select-option-id "47fc9ee4"
   ```

If the linked branch was already created, list linked branches or check out the existing local branch:

```bash
gh issue develop <ticket_number> --list
git checkout "$(git branch --list "<ticket_number>-*" | head -n 1 | sed 's/^[* ]*//')"
```

### Parent Spec Rollup

- When any child ticket moves to `In Progress`, update the parent Spec to `In Progress` on the project board:
  ```bash
  PARENT_RESP=$(gh api repos/{owner}/{repo}/issues/<ticket_number>/parent 2>&1) || PARENT_STATUS=$?
  if [ -z "${PARENT_STATUS:-}" ]; then
    PARENT_NUM=$(echo "$PARENT_RESP" | jq -r .number)
    PARENT_ITEM_ID=$(gh project item-add 8 --owner AhmedHanye --url "https://github.com/AhmedHanye/devtools/issues/${PARENT_NUM}" --format json --jq .id)
    gh project item-edit --id "$PARENT_ITEM_ID" --project-id "PVT_kwHOBtOqTs4BlBUk" --field-id "PVTSSF_lAHOBtOqTs4BlBUkzhjvvg4" --single-select-option-id "47fc9ee4"
  elif echo "$PARENT_RESP" | grep -q "No parent issue found"; then
    : # Standalone ticket without parent Spec
  else
    echo "Failed to query parent issue: $PARENT_RESP" >&2
    return 1 2>/dev/null || exit 1
  fi
  ```
- Parent Specs never move to `In Review` automatically from child tickets.
- Parent Specs remain `In Progress` until all child tickets reach `Done` and the maintainer reviews the Spec.

### Resolving a Ticket

Post the solution summary in a comment and close the ticket:

```bash
gh issue comment <ticket_number> --body "..."
gh issue close <ticket_number>
```

## Issue Hygiene

- Check off completed acceptance criteria (`- [x]`) as implementation progresses and when opening pull requests.
- Post technical discoveries and blocker alerts as issue comments.
- Keep issue descriptions updated: mark completed checklist items and revise outdated instructions or command references when scope evolves, while preserving the original problem statement and core acceptance criteria definitions.
