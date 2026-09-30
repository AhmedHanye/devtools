# Contributing to DevTools

This document outlines conventions, development workflows, and collaboration standards for human developers and agents.

## Development workflow

We follow an issue-first, vertical slice workflow:

1. Every change begins with an issue. Do not open a pull request without a tracking issue.
2. One ticket, one vertical slice. Break work into narrow, end-to-end vertical slices that can be implemented and tested in a single session.
3. No direct pushes to `main`. All code enters via reviewed pull requests.

## Branch naming and git conventions

Create short-lived branches from `main`:

- Format: `<type>/<short-description>` (lowercase, kebab-case, at most 40 characters, omit issue numbers)
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `infra`, `ci`, `test`
- Examples: `feat/user-auth`, `fix/route-timeout`, `chore/ci-quality-baseline`

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
2. Link the tracking issue in the pull request body using `Closes #<issue>`.
3. Provide verification evidence, including test terminal output or observable behavior.
4. Squash merge into `main` after local verification passes.

## Agent collaboration rules

Coding agents work as automated contributors in this repository. Both humans and agents follow these boundaries:

1. Claiming: Assign `@me` and set status before starting implementation:
   ```bash
   gh issue edit <number> --add-assignee @me --add-label "status:in-progress"
   ```
2. Issue modifications:
   - Agents may check off completed acceptance criteria (`- [x]`).
   - Agents may post technical discovery comments or blocker alerts.
   - Agents must never delete issues, alter the problem statement, or drop acceptance criteria.
3. Escalation: When requirements are ambiguous or tests fail repeatedly, apply the label `needs-human-review`, post a blocker summary, and yield execution.
