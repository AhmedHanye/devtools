# Agent guidelines

## Issue tracker

- Follow `.agents/docs/issue-tracker.md` for `gh` CLI commands and issue operations.
- Use domain terms from `.agents/CONTEXT.md` (`Spec`, `Ticket`, `Frontier`).
- **Contract-only tickets**: Define behavioral contracts and acceptance criteria in issues. Leave git branch names and commands to the execution session.
- **Observable verification**: Write acceptance criteria as checkable automated commands or observable behaviors (such as automated test suites, exit codes, HTTP status codes).

## Git and pull requests

- Follow repository conventions in `CONTRIBUTING.md` for branch naming, Conventional Commits, and pull requests.
- **Ticket partitioning**: Stage and commit only the files belonging to the active ticket before branching for subsequent tickets.
