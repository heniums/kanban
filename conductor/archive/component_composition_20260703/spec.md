# Specification: Component Composition Refactor

## Overview

Refactor the `CardDetail` / `CardDetailHeader` god-component and the monolithic `useCardDetail` hook into smaller, single-responsibility components and hooks. Data flows via props — no React Context. The goal is modularity: each component/hook does one thing well.

## Scope

### In Scope

1. **`src/components/cards/card-detail.tsx` + `card-detail-header.tsx`**
   - Decompose `CardDetailHeader` (16+ props) into smaller focused sub-components, each receiving only the props it needs (e.g., `TitleBar`, `MovePopover`, `DueDateField`).
   - Decompose `useCardDetail` (20+ returns) into focused sub-hooks (e.g., `useCardLabels`, `useCardMove`, `useCardDelete`, `useCardCopy`).
   - Compose these smaller pieces together in `CardDetail`.
   - No React Context — data flows via props.

2. **`src/components/cards/board-cards.tsx`**
   - Extract list CRUD handlers into a dedicated `useListActions` hook.
   - `BoardCards` becomes a thin composition layer.

3. **Debug log cleanup**
   - Remove all `console.log` debug statements in `use-card-detail.ts`.

### Out of Scope

- `list-column.tsx` (already well-structured)
- Changes to server actions, API routes, Socket.io layer, or Zustand store
- New feature additions

## Functional Requirements

1. **Single Responsibility**: Each component handles one concern (title editing, label management, move popover, etc.).
2. **Focused Hooks**: Each hook encapsulates one domain (labels CRUD, move logic, delete logic, copy logic).
3. **Props-Based Data Flow**: Data and handlers are passed as props. No context providers.
4. **Composable Assembly**: `CardDetail` becomes a thin composition layer that wires together focused components and hooks.
5. **No Debug Logs**: All `console.log` statements removed.
6. **Existing Tests Pass**: Updated to match new component/hook boundaries.

## Non-Functional Requirements

1. **Type Safety**: Full TypeScript type safety. No `any` types.
2. **No Regressions**: All card detail functionality works identically from the user's perspective.
3. **Performance**: No unnecessary re-renders. Use `useCallback` for stable handler references.

## Acceptance Criteria

1. `CardDetailHeader` no longer accepts 16+ props — replaced by composed sub-components each taking 2-5 props.
2. `useCardDetail` no longer returns 20+ values — logic split into focused sub-hooks.
3. `BoardCards` delegates list CRUD to `useListActions`.
4. Zero `console.log` debug statements remain.
5. `npm run typecheck`, `npm run lint`, `npm test` all pass.
6. Manual verification: full card detail workflow works.
