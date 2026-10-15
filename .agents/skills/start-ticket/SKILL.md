---
name: start-ticket
description: Prepare a fresh, linked branch for an assigned issue and sync local state with main.
disable-model-invocation: true
---

# Start ticket

Prepare the workspace and branch for an issue. Follow `CONTRIBUTING.md`.

## Checklist

- [ ] Resolve target issue number from user input or title search. Prompt if missing.
- [ ] Verify clean working tree. Stop if dirty until resolved.
- [ ] Checkout local `main` and pull `origin/main`.
- [ ] Checkout linked issue branch (or existing local branch).
- [ ] Self-assign issue to `@me`.
- [ ] Set ticket to `In Progress` in Project #8.
- [ ] Set parent Spec to `In Progress` in Project #8 if linked.
