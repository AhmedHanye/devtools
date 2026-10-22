# Glossary Map

Domain vocabulary for DevTools packages and applications mapped across bounded contexts.

## Contexts

- [Runtime & CLI](./docs/glossary/runtime.md): single Bun daemon process, API routing, runtime stack, standalone executable compilation, and release manifests.
- [Browser Automation](./docs/glossary/browser.md): Chrome for Testing binary resolution waterfall, caching hierarchy, and explicit path overrides.
- [Persistence](./docs/glossary/persistence.md): embedded SQLite engine, Drizzle ORM primitives, and schema migrations.

## Relationships

- **Runtime & CLI → Persistence**: The runtime daemon and CLI commands initialize `@devtools/db` connections, run migrations on startup, and query application state.
- **Runtime & CLI → Browser Automation**: CLI browser commands execute the browser resolution waterfall and consume cached Chrome for Testing executables.
- **Shared Contracts (`@devtools/core`)**: Supplies shared domain schemas, types, and error primitives across all contexts.

## Architectural Decisions

- [System ADRs](./docs/adr/): architectural decision records for persistent storage and cross-package boundaries.
