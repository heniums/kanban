# Specification: Component Composition Refactor

## Overview

Refactor the `CardDetail` / `CardDetailHeader` god-component pattern and the `BoardCards` orchestrator into a composable component architecture. Each sub-component will be self-contained, managing its own slice of state and behavior, and composed together at the top level. The `useCardDetail` monolithic hook will be decomposed accordingly. Debug `console.log` statements will be removed.

## Scope

### In Scope

1. **`src/components/cards/card-detail.tsx` + `card-detail-header.tsx`**
   - Decompose `CardDetailHeader` (16+ props) into smaller composable sub-components (e.g., `TitleBar`, `MovePopover`, `DeleteCardButton`, `DueDateField`, `LabelsField`, `AssigneesField`).
   - Decompose `useCardDetail` hook (20+ returns) into focused sub-hooks or distribute logic into the composable components themselves.
   - Eliminate the prop-drilling pattern where `CardDetail` passes 10+ inline handler closures to `CardDetailHeader`.
   - The public API of `CardDetail` may change if it leads to a better architecture.

2. **`src/components/cards/board-cards.tsx`**
   - Reduce handler-passing complexity (handleAddList, handleRenameList, handleDeleteList closures passed to children).
   - Extract list mutation logic into a dedicated hook or composable pattern.

3. **Debug log cleanup**
   - Remove all `console.log` debug statements in `use-card-detail.ts` (lines 210-214, 230, 232).

### Out of Scope

- `list-column.tsx` (already well-structured with local state management)
- Changes to server actions or API routes
- Changes to the real-time Socket.io layer
- Changes to the Zustand board store
- New feature additions

## Functional Requirements

1. **Composable Architecture**: Each sub-component (title, labels, assignees, due date, move, delete) should be independently renderable and testable.
2. **State Distribution**: Shared state (card data, draft, pending status) should be distributed via React Context or a similar composable pattern, eliminating prop drilling.
3. **Behavior Encapsulation**: Each composable component should encapsulate its own behavior (e.g., `LabelsField` handles label toggle, create, update, delete internally).
4. **BoardCards Simplification**: List CRUD handlers should be extracted into a custom hook (e.g., `useListActions`) to reduce `BoardCards` complexity.
5. **No Debug Logs**: All `console.log` debug statements must be removed.
6. **Existing Tests Pass**: All existing tests in `card-detail.test.tsx`, `card-item.test.tsx`, `board-cards-dnd.test.tsx` must continue to pass or be updated to match the new API.

## Non-Functional Requirements

1. **Type Safety**: Full TypeScript type safety maintained. No `any` types introduced.
2. **No Regressions**: All existing card detail functionality (edit title, labels, assignees, due date, move, copy, delete, checklists, comments) must work identically from the user's perspective.
3. **Performance**: No unnecessary re-renders introduced by the context pattern. Use `useMemo` / `useCallback` where appropriate.

## Acceptance Criteria

1. `CardDetailHeader` no longer accepts 16+ props. Its sub-components are composed declaratively.
2. `useCardDetail` no longer returns 20+ values. Logic is distributed into composable components or focused sub-hooks.
3. `BoardCards` no longer defines inline CRUD handler closures for lists.
4. Zero `console.log` debug statements remain in `use-card-detail.ts`.
5. `npm run typecheck` passes.
6. `npm run lint` passes.
7. `npm test` passes (existing tests updated as needed).
8. Manual verification: card detail dialog opens, edits save, labels/assignees/due date work, move/copy/delete work.
