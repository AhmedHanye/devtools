# Contributing to DevTools

Welcome to DevTools. This repository enforces an issue-first, vertical slice workflow with automated release management.

## Development Workflow

1. **Issue-First**: Every change begins with an issue. Ensure every pull request links to an existing tracking issue.
2. **Vertical Slices**: One ticket, one vertical slice. Deliver end-to-end functionality across schema, logic, UI, and tests in a single session.
3. **Reviewed Pull Requests**: Deliver all code to `main` through reviewed and tested pull requests.

## Must-Know Global Invariants

- **Git & GitHub CLI**: Use `gh` for all GitHub interactions. Create linked branches with `gh issue develop <ticket_number> --checkout`.
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`<type>(<scope>): <desc>`). Commit types (`feat:`, `fix:`) trigger automated releases via Release Please. Do **not** place issue references in commit subjects.
- **Atomic Commits**: Stage files selectively by path (`git diff --cached --stat`). Never use blanket `git add .`.
- **Pull Requests**:
  - Always self-assign as the DRI (`gh pr create --assignee "@me"`).
  - Follow [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
  - Resolve all reviewer and automated bot (e.g., CodeRabbit) comment threads prior to merge.
  - Merge via squash merging (`gh pr merge --squash --delete-branch`).

## Detailed Documentation

For full operational commands, bash snippets, and GraphQL queries, refer to the guides under [docs/contributing/](docs/contributing/):

| Guide                                                                   | Description                                                                                                                   |
| :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **[Pull Requests and Code Review](docs/contributing/pull-requests.md)** | Pull request creation, DRI assignment, status transitions, review thread resolution via GraphQL, and squash merge protocols.  |
| **[Issue Tracking and Management](docs/contributing/issues.md)**        | Issue CLI commands, Spec vs. Ticket hierarchy, sub-issues and dependencies, linked branches, and GitHub Project #8 lifecycle. |
| **[Commits and Atomic Changes](docs/contributing/commits.md)**          | Conventional Commits taxonomy, clean commit subjects, and atomic staging rules.                                               |
| **[Releases and Distribution](docs/contributing/releases.md)**          | Google Release Please pipeline, semver bumping rules, and multi-architecture binary artifacts.                                |
