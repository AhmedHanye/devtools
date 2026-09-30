# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues. Use the `gh` CLI for all operations.

## CLI commands

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,state,comments,subIssues`. Always specify `--json` to avoid deprecated GraphQL queries.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

The repository is inferred from `git remote -v`.

## Pull requests as a triage surface

External pull requests are not treated as feature requests. New features begin as issues.

When inspecting pull requests:
- **Read a PR**: `gh pr view <number> --json number,title,body,labels,comments` and `gh pr diff <number>` for the diff.
- **List PRs**: `gh pr list --state open --json number,title,body,labels,author,comments`

GitHub shares one number space across issues and PRs. Resolve a number with `gh pr view <number>` first, then fall back to `gh issue view <number>`.

## Hierarchical sub-issues and dependencies

The project tracks work using Specs (parent issues) and Tickets (child sub-issues).

- **Add sub-issue**: Link a ticket to a parent spec:
  ```bash
  gh api --method POST repos/:owner/:repo/issues/<spec_number>/sub_issues \
    -F sub_issue_id=<ticket_db_id>
  ```
- **Add dependency**: Link a blocker to a blocked ticket:
  ```bash
  gh api --method POST repos/:owner/:repo/issues/<ticket_number>/dependencies/blocked_by \
    -F issue_id=<blocker_db_id>
  ```
- **Resolve database ID**: Obtain the numeric database ID:
  ```bash
  gh api repos/:owner/:repo/issues/<number> --jq .id
  ```
- **Single source of truth**: Omit manual parent links, child checklists, and `Blocked by: #...` lines from markdown bodies when native sub-issues and dependencies are enabled.
- **Milestones**: Assigned strictly to **Specs** (parent epics) to track milestone deliverables without metric dilution. Child **Tickets** do not receive milestones.
- **Query frontier**: List open child tickets with zero unresolved blockers and no assignee.
- **Claim ticket & create linked branch**: Assign `@me` and create the native linked branch:
  ```bash
  gh issue edit <ticket_number> --add-assignee @me
  gh issue develop <ticket_number> --checkout
  ```
  Check the parent Spec: if it is currently in `Todo` or `Blocked / Backlog`, update the parent Spec to `In Progress`. Parent Specs never move to `In Review` based on child ticket activity.
- **Submit for review**: When implementation and verification pass:
  ```bash
  gh pr ready <pr_number>
  ```
- **Resolve ticket**: Post the solution summary in a comment and close the ticket:
  ```bash
  gh issue comment <number> --body "..."
  gh issue close <number>
  ```
