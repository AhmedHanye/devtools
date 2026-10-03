# Agent guidelines

## Context pointers

- **Issue tracker**: Follow `.agents/docs/issue-tracker.md` for `gh` commands, ticket hierarchy, claiming, and board status.
- **Git workflow**: Follow `CONTRIBUTING.md` for linked branches, Conventional Commits, and pull requests.
- **Domain terms**: Use `.agents/CONTEXT.md` for project vocabulary and system nouns (`Daemon`, `Runtime Stack`, `Spec`, `Ticket`, `Frontier`, `DRI`).
- **Architecture decisions**: Consult `.agents/docs/adr/` for recorded architectural decisions.

## Execution boundaries

- **Rule discovery**: Rule files in `.agents/rules/*.md` trigger automatically based on frontmatter glob patterns. Do not add redundant manual pointers for rule files into `AGENTS.md`.
- **Architecture decision record (ADR) threshold**: Create an ADR in `.agents/docs/adr/` only when a decision satisfies all three criteria: (1) hard to reverse (meaningful cost to walk back), (2) surprising without context (non-obvious rationale), and (3) involves a significant architectural trade-off between viable options. Standard implementation details, library configurations, framework conventions, and dev tooling never receive an ADR.
- **Contract-first tickets**: Define behavioral contracts and automated acceptance criteria in issues. Omit execution commands and branch names.
- **Observable verification**: Write acceptance criteria as checkable automated commands or observable behaviors (test runs, exit codes, HTTP status codes).
- **Ticket partitioning**: Stage only the files belonging to the active ticket before branching for subsequent tickets.
- **Working artifact storage**: Save temporary scripts, research spikes, and session handoffs in `.scratch/` (`.scratch/handoffs/`, `.scratch/research/`). Confine all ephemeral outputs to `.scratch/` rather than `/tmp` or the workspace root.
- **Instruction hygiene**: Follow `.agents/skills/unslop` and `.agents/skills/writing-for-agents` whenever creating or editing instructions, rules, or documentation in `.agents/`.
- **Git commit & push checkpoint**: Require explicit confirmation from the user before executing `git commit`, `git push`, or opening pull requests. Present `git status` and a compact summary (`git diff --stat`) for review prior to committing or pushing; omit raw diffs.
- **Immutable locked skills**: Treat all skills declared in `skills-lock.json` (`.agents/skills/*`) as vendor-managed, read-only assets.
- **Escalation**: When requirements are ambiguous or tests fail repeatedly, apply `needs-human-review`, post a blocker summary, and yield execution.
- **Package manager & runner**: Always use `bun` and `bunx` exclusively instead of `npm`, `npx`, `pnpm`, or `yarn`.
