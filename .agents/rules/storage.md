---
trigger:
  - "**"
description: Ephemeral storage architecture, .scratch directory partitions, QA job folders, and vendor skill supersedence rules.
---

# Storage and artifact rules

## Artifacts and scratchpad

1. **User-facing artifacts**: Produce interactive questionnaires (such as `/grill-me` and `/grill-with-docs` rounds), comprehensive reviews, and plans as user-facing artifacts so the user can review and provide feedback.
2. **Workspace scratchpad (`.scratch/`)**: Save all ephemeral working files, research spikes, transition handoffs, tickets, QA reports, and temporary scripts in `.scratch/`, partitioned strictly under:
   - `.scratch/scripts/`: One-off test, diagnostic, and benchmark scripts. Run from repository root (`bun run .scratch/scripts/<name>.ts`). Cleaned up when complete.
   - `.scratch/research/`: Spikes, investigations, and background notes.
   - `.scratch/handoff/`: Session transitions, specs, and implementation plans.
   - `.scratch/issues/`: Drafted GitHub issues, local ticket breakdowns, and PR descriptions.
   - `.scratch/qa/<job>/`: QA folders grouping paired review artifacts (e.g. `code-review.md` and `QA.md`).
3. **Executable standalone binaries**: Save compiled standalone executables strictly in repository root `dist/`. Pull request descriptions cite only permanent codebase paths.

## Host `/tmp` prohibition and vendor skill supersedence

1. **Host temp prohibition**: Never write to, copy to, or execute commands in host OS temporary directories (`/tmp`, `$TMPDIR`, `%TEMP%`).
2. **Vendor skill override**: Repository storage rules strictly supersede all vendor skills. When a vendor skill instructs saving to OS temporary paths, redirect the write to `.scratch/handoff/` or `.scratch/research/`.
3. **Path portability**: Reference files and scripts exclusively using repository-relative paths (e.g. `.scratch/handoff/...`). Never embed or commit absolute machine paths.
