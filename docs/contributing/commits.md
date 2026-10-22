# Commits and Atomic Changes

Guidelines for writing Conventional Commits, clean commit subjects, and staging atomic changesets.

## Conventional Commits

Commit messages follow the Conventional Commits specification:

```text
<type>(<scope>): <imperative description>
```

### Commit Types

- `feat`: Adds a new feature or user-facing capability.
- `fix`: Patches a bug or defect.
- `chore`: Maintenance, dependencies, or toolchain updates.
- `docs`: Documentation changes only.
- `test`: Adding or refactoring test suites.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `style`: Formatting or cosmetic changes with zero logic impact.

### Clean Commit Subjects

Keep commit subjects clean by reserving issue references (such as `Closes #123`) for pull request descriptions. Issue references are disallowed in commit subjects and enforced by repository commitlint rules. This prevents issue timeline pollution and preserves a clean linear history.

Examples:

- `feat(server): add initial health check endpoint`
- `fix(web): resolve layout shift on mobile viewports`
- `chore(ci): update workflow dependencies`

## Atomic Commits

Every commit must represent a single logical change scoped to a specific workspace (`<type>(<scope>): <desc>`). Never use blanket `git add .`; stage files selectively by path and verify staged contents before committing:

```bash
git diff --cached --stat
```
