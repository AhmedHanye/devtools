---
trigger: apps/frontend/**
description: Frontend development invariants for Next.js App Router, Base UI, design system contracts, hydration safety, and quality gates.
---

# Frontend invariants and standards

Authoritative architectural rules and development standards for `apps/frontend`.

## Architecture

1. Route entrypoints in `src/app/` act as thin routing adapters containing layout metadata and providers. Delegate all feature presentation and orchestration to Feature-Sliced Design pages in `src/pages/<page>/`.
2. Segment public APIs are explicit. Each shared segment exposes its public API through its own index file (`src/shared/ui/index.ts`, `src/shared/lib/index.ts`, `src/shared/api/index.ts`).
3. Segment files follow domain naming (`service-status-card.tsx`, `use-service-health.ts`). Use domain-relevant nouns rather than technical role labels (`component.tsx`, `types.ts`, `utils.ts`).
4. File and directory names use lowercase `kebab-case`. `PascalCase` is reserved for exported React components and TypeScript type symbols.

## Design system and components

1. Interactive components compose via Base UI `render={<Component />}` props and React 19 `ref` forwarding.
2. Styling adheres to `@shadcn/lint` design system contracts:
   - Use semantic theme tokens (`bg-primary`, `text-muted-foreground`, `bg-background`, `border-border`).
   - Component appearance is governed by component variants (`variant="outline"`, `size="sm"`). Reserve `className` on components for layout, alignment, and positioning (`flex`, `grid`, `gap-*`, `m-*`).
   - Declare static class names using theme utilities rather than dynamic string interpolation or arbitrary square-bracket values.
   - Use `flex gap-*` and `grid gap-*` for element layout. Use `size-*` utilities for symmetric dimensions.
3. Express distinct component states through specialized variant components (`<CompactStatusCard />`, `<EditStatusCard />`) rather than accumulating multi-state boolean flags.
4. Pass layout content via `children` and compound components. Reserve render callback props for dynamic list iteration.
5. React 19 patterns:
   - Pass `ref` as a standard prop in the component interface.
   - Render `<Context value={val}>` directly without the `.Provider` suffix.
   - Consume contexts with `use(Context)`.

## Browser boundaries and hydration

1. Guard client-only subtrees with `useIsMounted()` from `@/shared/lib`, using `useSyncExternalStore` for tear-free hydration.
2. Read client search parameters through `useNativeSearchParams()` from `@/shared/lib` to preserve static prerendering without requiring top-level Suspense boundaries.
3. Browser globals (`window`, `document`, `localStorage`, `sessionStorage`) are guarded with `typeof window !== "undefined"`. Storage access is wrapped with in-memory fallbacks to guarantee safe server-side evaluation.
4. Data hooks and network clients supply deterministic static fallback fixtures (such as `DEFAULT_HEALTH_FALLBACK`) so static build generation resolves cleanly.

## State and asynchronous boundaries

1. Represent multi-stage asynchronous lifecycles using discriminated unions (`status: "idle" | "loading" | "success" | "error"`).
2. Derive calculated state synchronously during rendering. Synchronize with effects strictly for external imperative subscriptions and browser APIs.
3. Declare Zod schemas statically at module scope to enable schema caching and direct type inference.
4. Hooks managing polling lifecycles scope an `AbortController` per polling tick, aborting in-flight requests on unmount or re-trigger.
5. Declare pure helper functions and formatters that do not close over component state at module scope.

## Verification pipeline

Run the complete verification pipeline before presenting code for review:

```bash
bun run format
bun run check
bun run lint:design
bun run --filter '@devtools/frontend' lint:fsd
bun run typecheck
bun run test
```

All commands must exit with code 0 and zero warnings or errors.
