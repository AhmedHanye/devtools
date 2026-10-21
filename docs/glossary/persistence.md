# Persistence Context

Domain terms for embedded SQLite database foundation, connection lifecycles, and configuration injection.

## Language

**Embedded Database Foundation**:
The `@devtools/db` local persistence layer using `bun:sqlite` with Drizzle ORM, WAL journal mode, and synchronous crash-resilient settings.
_Avoid_: Local storage layer, sqlite backend, persistence engine

**Configuration Seam**:
A dedicated package module that isolates ambient environment variable reads and accepts an optional injection parameter for hermetic test execution.
_Avoid_: Config adapter, env wrapper, config provider, environment bridge
