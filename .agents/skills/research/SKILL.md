---
name: research
description: Research technical questions against primary sources, codebase facts, and external documentation in a dedicated subagent. Use when investigating architecture, API contracts, library options, security practices, or delegating technical exploration.
---

# Research

Investigate technical questions against primary sources, verify facts across code and documentation, and capture findings in a persistent markdown report.

## Core rules

1. **Subagent isolation.** Multi-step research runs in a dedicated subagent to keep the main conversation context clean. When invoked in the primary session, dispatch a subagent, await reactive completion, and present the final summary.
2. **Mandatory web search for external topics.** When research touches external libraries, APIs, CVEs, security advisories, or ecosystem practices, live search is mandatory. Use `search_web` and available MCP search or documentation tools. Do not rely on internal memory for external library behavior or security disclosures.
3. **Primary sources over hearsay.** Treat compilers, tests, runtime outputs, and source code as ground truth. Consult official specifications, RFCs, and first-party documentation before secondary articles. Discard or quarantine third-party blog posts and unverified summaries.
4. **Document reality first.** Record how the system currently works before proposing architectural changes.
5. **Search for counter-evidence.** For every technical assumption or hypothesis, search for contrary facts, deprecation notices, version mismatches, and edge-case limitations.

## Workflow

### 1. Scope and decompose

1. Read all user-referenced files, tickets, or schemas completely before starting research.
2. Formulate 2 to 4 concrete, falsifiable research questions.
3. Identify required evidence sources across local codebase files, external web documentation, and empirical tests.

Completion criterion: 2 to 4 specific research questions and identified evidence sources.

### 2. Dispatch research subagent

1. When running in the foreground session, dispatch a dedicated subagent using `invoke_subagent`. Pass:
   - The scoped research questions.
   - Codebase context pointers and relevant file paths.
   - Search directives for external topics requiring web queries.
   - Target report path at `.scratch/research/<topic>.md`.
2. Await reactive completion notification without polling loops.
3. When already running inside a child subagent, skip dispatch and proceed directly to step 3.

Completion criterion: Dedicated subagent dispatched from foreground session, or execution active inside a child subagent.

### 3. Gather primary evidence

Execute within the subagent:

1. **External web search.** When questions involve external packages, APIs, security advisories, CVEs, or ecosystem practices, run targeted queries with `search_web` and available MCP search or scraping tools. Extract first-party documentation, specifications, release changelogs, and security advisories. Record exact source URLs, package versions, and publication dates.
2. **Codebase evidence.** Locate relevant symbols, types, tests, and configuration files. Capture exact repository-relative paths and line numbers.
3. **Empirical evidence.** When static documentation is ambiguous, verify behavior with quick CLI checks, such as `--help` or type checks, or existing test fixtures.

Completion criterion: Verifiable external documentation URLs and repository-relative code references for every research question.

### 4. Falsify and cross-examine

1. Check for version drift. Verify that external documentation matches the exact package version declared in `package.json` or lockfiles.
2. Search for breaking changes, caveats, open GitHub issues, and known edge cases.
3. If two sources disagree, prioritize executable code and tests over written documentation, and prioritize official docs over community discussions.

Completion criterion: Conflicting claims resolved or explicitly documented with confidence ratings.

### 5. Synthesize and persist

Write the research document to `.scratch/research/<topic>.md` using the template below.

<research-template>

# Research: <topic title>

**Date**: YYYY-MM-DD  
**Status**: Completed | In progress  
**Confidence**: High | Medium | Low  
**Scope**: Primary packages, modules, or external libraries investigated  

## Executive summary

Direct answer to the research questions and trade-offs in 2 to 3 paragraphs.

## Primary source findings

### <Sub-topic or component 1>

Detailed technical findings for existing behavior, contracts, or data flow:
- Finding statement backed by evidence ([file.ts#L10-L25](file.ts#L10-L25)).
- Interaction with adjacent modules or dependencies.

### <Sub-topic or component 2>

Detailed technical findings for the second area.

## Code and spec references

- `packages/core/src/schema.ts#L15-L35`: Primary interface definition.
- `apps/cli/src/commands/build.ts#L45-L60`: Invocation entry point.
- Canonical documentation URL or RFC reference.

## Technical trade-offs

| Option or pattern | Advantages | Disadvantages | Complexity |
| :--- | :--- | :--- | :--- |
| **Option A** | Concrete benefit | Known limitation | Low / Medium / High |
| **Option B** | Concrete benefit | Known limitation | Low / Medium / High |

## Open questions and caveats

- Remaining uncertainties or unverified runtime behaviors.
- Potential breaking changes or migration hurdles.

</research-template>

Completion criterion: The file exists at `.scratch/research/<topic>.md` with all template sections completed and no placeholders remaining.

### 6. Present summary

Deliver a response that:
1. Answers the user questions directly in under 300 words.
2. Links to the report at `.scratch/research/<topic>.md`.
3. Highlights key trade-offs and confidence levels.

Completion criterion: Response sent to user with under 300 words, repository-relative link to `.scratch/research/<topic>.md`, and trade-offs.
