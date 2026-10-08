---
trigger:
  - "**"
description: Change-scoped verification matrix, observable verification standards, and reactive background execution rules.
---

# Verification and background execution rules

Rules for selecting verification commands tailored to changed files, defining observable acceptance criteria, and executing background tasks reactively.

## Decision matrix for verification

Run proportionate, change-scoped checks during iterative development. Run the full verification gate before opening a pull request or when modifying cross-package contracts.

| Changed files                                | Verification scope    | Commands                                                                                                                                                            |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/**`, `.github/actions/**` | Workflow validation   | `bunx prettier --check .github/workflows/**` <br> `bun scripts/verify-staged-secrets.ts .github/workflows/**`                                                       |
| `apps/<pkg>/**`                              | Application workspace | `bun --filter @devtools/<pkg> typecheck` <br> `bun --filter @devtools/<pkg> test` <br> (For frontend: `bun --filter @devtools/frontend lint:design` and `lint:fsd`) |
| `packages/<pkg>/**`                          | Package workspace     | `bun --filter @devtools/<pkg> typecheck` <br> `bun --filter @devtools/<pkg> test`                                                                                   |
| `scripts/**`                                 | Internal scripts      | `bun test scripts/` <br> `bun run check`                                                                                                                            |
| `.agents/**`, documentation (`*.md`)         | Docs and guidelines   | `bun run check`                                                                                                                                                     |
| Cross-cutting / Pre-PR gate                  | Full quality gate     | `bun run verify`                                                                                                                                                    |

## Workflow change invariant

Pull requests modifying only `.github/workflows/**` specify workflow validation rather than monorepo application test suites. Do not run application test suites (`bun --filter '*' test`) when changes are isolated to CI workflow definitions.

## Observable verification

1. Write acceptance criteria as checkable automated commands or observable behaviors (test runs, exit codes, HTTP status codes).
2. Record concrete verification evidence in pull request descriptions.
3. Eliminate unjustified full `bun run verify` runs during iterative development; run targeted package or script checks instead.

## Reactive background execution

1. Prohibit synchronous status polling loops on background tasks (such as repeatedly checking status in a loop or calling sleep commands).
2. Yield execution and await system notifications when running asynchronous tasks.
3. The execution system notifies the agent upon task completion. Proceed with other work or stop calling tools while background tasks run.
