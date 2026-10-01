# Agent guidelines

## Context pointers

- **Issue tracker**: Follow `.agents/docs/issue-tracker.md` for `gh` commands, ticket hierarchy, claiming, and board status.
- **Git workflow**: Follow `CONTRIBUTING.md` for linked branches, Conventional Commits, and pull requests.
- **Domain terms**: Use `.agents/CONTEXT.md` (`Spec`, `Ticket`, `Frontier`, `DRI`).
- **Architecture decisions**: Consult `.agents/adr/` for recorded architectural decisions.

## Execution boundaries

- **Contract-first tickets**: Define behavioral contracts and automated acceptance criteria in issues. Omit execution commands and branch names.
- **Observable verification**: Write acceptance criteria as checkable automated commands or observable behaviors (test runs, exit codes, HTTP status codes).
- **Ticket partitioning**: Stage only the files belonging to the active ticket before branching for subsequent tickets.
- **Working artifact storage**: Save temporary scripts, research spikes, and session handoffs in `.scratch/` (`.scratch/handoffs/`, `.scratch/research/`). Never write temporary files to `/tmp` or the workspace root.
- **Instruction hygiene**: Follow `.agents/skills/unslop` and `.agents/skills/writing-for-agents` whenever creating or editing instructions, rules, or documentation in `.agents/`.
- **Git commit & push checkpoint**: Never run `git commit`, `git push`, or create pull requests without explicit confirmation from the user. Present `git status` and a compact summary (`git diff --stat`) for user review before committing or pushing; do not output raw diffs.
- **Immutable locked skills**: Never modify any skills listed in or belonging to `skills-lock.json` (`.agents/skills/*`). All locked skills are vendor-managed and strictly read-only.
- **Escalation**: When requirements are ambiguous or tests fail repeatedly, apply `needs-human-review`, post a blocker summary, and yield execution.
