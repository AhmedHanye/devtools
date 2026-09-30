# Contributing to DevTools

This document outlines conventions, development workflows, and collaboration standards for human developers and agents.

## Development workflow

We follow an issue-first, vertical slice workflow:

1. Every change begins with an issue. Do not open a pull request without a tracking issue.
2. One ticket, one vertical slice. Break work into narrow, end-to-end vertical slices that can be implemented and tested in a single session.
3. No direct pushes to `main`. All code enters via reviewed pull requests.

## Branch naming and git conventions

Use GitHub's native linked branching for all tickets:

```bash
gh issue develop <ticket_number> --checkout
```

This creates and checks out the branch `<ticket_number>-<title-slug>` and officially associates it with the issue under GitHub Development.

## Commits and pull requests

### Commit format

Follow Conventional Commits:

```text
<type>(<scope>): <imperative description> (#<issue>)
```

Examples:
- `feat(server): add initial health check endpoint (#12)`
- `fix(web): resolve layout shift on mobile viewports (#15)`
- `chore(ci): update workflow dependencies (#20)`

### Pull request rules

1. Open draft pull requests early. Run `gh pr create --draft` when creating the branch.
2. Link the tracking issue in the pull request body using `Closes #<issue>` (auto-linked when using `gh issue develop`).
3. Provide verification evidence, including test terminal output or observable behavior.
4. When work and verification are complete, mark the PR ready for review: `gh pr ready <pr_number>`.
5. Squash merge into `main` after review passes.

## Agent collaboration rules

Coding agents work as automated contributors in this repository. Both humans and agents follow these boundaries:

1. Claiming & Branching: Assign `@me`, create the linked branch, and ensure the parent Spec is in `In Progress`:
   ```bash
   gh issue edit <ticket_number> --add-assignee @me
   gh issue develop <ticket_number> --checkout
   ```
   If the parent Spec is currently in `Todo` or `Blocked / Backlog`, move the parent Spec to `In Progress` on the Project Board. Parent Specs never move to `In Review` automatically from child tickets.
2. Issue modifications:
   - Agents may check off completed acceptance criteria (`- [x]`).
   - Agents may post technical discovery comments or blocker alerts.
   - Agents must never delete issues, alter the problem statement, or drop acceptance criteria.
3. Escalation: When requirements are ambiguous or tests fail repeatedly, apply the label `needs-human-review`, post a blocker summary, and yield execution.
