---
name: documentation-authoring
description: Author technical documentation for the documentation platform. Use when writing Fumadocs MDX across Diátaxis quadrants or verifying documentation compilation.
---

# Documentation authoring

This skill directs the creation, maintenance, and verification of technical documentation for the documentation platform (`site/`, `@devtools/site`). All documentation adheres to the Diátaxis framework and Fumadocs MDX standards.

## Context pointers

- **Fumadocs reference**: Read [.agents/skills/documentation-authoring/references/fumadocs-features.md](.agents/skills/documentation-authoring/references/fumadocs-features.md) for Fumadocs MDX components, Shiki code highlighting, page tree syntax, and styling tokens.
- **Diátaxis blueprints**: Read [.agents/skills/documentation-authoring/references/diataxis-quadrants.md](.agents/skills/documentation-authoring/references/diataxis-quadrants.md) for quadrant specifications, accessibility rules, and diagnostic procedures.
- **Domain vocabulary**: Read `.agents/GLOSSARY.md` for platform definitions and terminology standards.

## Quadrant decision rules

Select the quadrant that matches reader intent before writing:

| Reader intent | Target quadrant | Path prefix | Pedagogical orientation |
| ------------- | --------------- | ----------- | ----------------------- |
| Learning to use a tool from scratch | Tutorial | `site/content/docs/tutorials/` | Learning-oriented |
| Solving a specific practical problem | How-to guide | `site/content/docs/how-to/` | Problem-oriented |
| Looking up exact technical specifications | Reference | `site/content/docs/reference/` | Information-oriented |
| Understanding architecture or decisions | Explanation | `site/content/docs/explanation/` | Understanding-oriented |

Do not blend quadrants within a single document. Keep tutorials linear, how-to guides task-focused, reference pages factual, and explanations conceptual.

## Authoring workflow

Follow these steps in order when creating or editing documentation.

### 1. Select quadrant and file location

1. Determine reader intent using the quadrant decision rules.
2. Select the destination file path under `site/content/docs/<quadrant>/<topic>.mdx`.
3. Completion criterion: The target file path sits inside the designated quadrant directory.

### 2. Configure frontmatter

1. Add YAML frontmatter at the start of the file.
2. Include sentence case `title` and a concise `description` summarizing the document.
3. Completion criterion: Frontmatter contains non-empty `title` and `description` strings without preceding whitespace.

```yaml
---
title: Start the local daemon
description: Configure and start the DevTools background daemon process.
---
```

### 3. Structure headings

1. Start body headings with level 2 (`##`). Fumadocs generates the level 1 heading from the frontmatter `title`.
2. Apply sentence case to all headings.
3. Maintain strict hierarchy. Nest `###` under `##`, and `####` under `###`. Never skip heading levels.
4. Completion criterion: The document body contains zero level 1 (`#`) headings and zero skipped heading levels.

### 4. Apply Fumadocs MDX syntax

1. Specify language tags on every fenced code block (`bash`, `ts`, `tsx`, `json`, `yaml`).
2. Add `title="path/to/file"` on code blocks representing specific files.
3. Use GitHub alert syntax (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) for callouts, or import Fumadocs UI components.
4. Import Fumadocs components directly when using tabs, steps, or cards:
   ```mdx
   import { Step, Steps } from 'fumadocs-ui/components/steps';
   import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
   import { Card, Cards } from 'fumadocs-ui/components/card';
   ```
5. Completion criterion: Every fenced code block has a language identifier, all JSX tags close cleanly, and all component imports resolve correctly.

### 5. Validate accessibility and style invariants

1. Provide descriptive alt text on every image explaining its content and function.
2. Use descriptive link labels that identify the destination. Never write "click here", "here", or bare URLs.
3. Check that diagrams render with clear text labels and support light and dark backgrounds.
4. Reference repository paths relative to the repository root. Never write absolute machine paths.
5. Apply instruction hygiene. Eliminate AI buzzwords, fancy synonyms for "is", and mid-sentence colons. Avoid em dashes entirely; use commas or periods instead.
6. Completion criterion: The file contains zero missing alt attributes, zero generic link labels, zero em dashes, and zero absolute file paths.

### 6. Verify compilation and route integrity

Run build verification using Bun workspace commands:

```bash
# Verify MDX compilation and page generation
bun --filter @devtools/site build

# Verify TypeScript type correctness across site components and content
bun --filter @devtools/site typecheck

# Verify formatting and static analysis
bun run check
```

Completion criterion: `bun --filter @devtools/site build` and `bun --filter @devtools/site typecheck` exit with code 0 without compilation errors.
