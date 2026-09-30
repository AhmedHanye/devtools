# 0002: Issue Branching, Milestone Scope, and Project Status Lifecycle

## Context

Managing issue status across both repository labels (`status:*`) and GitHub Projects (v2) fields created duplicate state, manual friction, and out-of-sync boards. Furthermore, ad-hoc branch naming prevented GitHub from establishing native issue-branch relationships and automations.

## Decision

1. **Native Branching**: All ticket execution branches must be created using `gh issue develop <ticket_number> --checkout`. GitHub automatically assigns the standard `<number>-<slug>` name and registers the branch as a first-class linked branch on the issue.
2. **Milestone Scoping**: Milestones are assigned strictly to **Specs** (parent epics) to track capability releases without metric dilution. Child **Tickets** do not receive milestones; their progress rolls up via native GitHub Sub-issues (`x/y`).
3. **Single Source of Truth for Status**: Eliminate all `status:*` labels from the repository. Status is tracked exclusively on the GitHub Project Board (`Todo`, `In Progress`, `In Review`, `Done`).
4. **Parent Spec Status Rollup**:
   - When any child Ticket begins implementation (`In Progress`), its parent Spec automatically moves to `In Progress`.
   - Parent Specs never move to `In Review` based on child ticket activity; they remain `In Progress` until all child tickets reach `Done` and are verified by the maintainer.
   - Atomic Tickets (child tickets and standalone issues) transition automatically: `Todo` -> `In Progress` (via linked branch / PR) -> `In Review` (when PR is marked ready) -> `Done` (on PR merge).

## Consequences

- Agents no longer invent custom branch names or manage redundant `status:*` labels.
- Dual-state desynchronization between issues and project boards is eliminated.
- Milestone completion graphs accurately reflect feature delivery.
