# Specification: Fix List Reordering Bug

## Track Type

Bug Fix

## Overview

Users cannot reorder lists on a kanban board. When a user drags a list to a new horizontal position and releases it, the list visually **snaps back** to its original position in the live session, even though the new order is persisted to the database (visible after a hard page reload). Additionally, list reorders are never broadcast over Socket.io, so collaborating users on the same board never see reorders in real time.

This breaks the product's core MVP commitments to "Lists: Create, rename, delete, reorder within a board" and "Real-Time Collaboration: Multiple users on the same board see changes live" (see `conductor/product.md`).

## Root Cause

The list-reorder path in `src/components/cards/board-cards.tsx` (`handleDragEnd`, list branch) has two defects:

1. **No local store update (optimistic or reconciled).** `handleDragEnd` computes the new order via `arrayMove` and calls `reorderListsAction`, but it never updates the Zustand `useBoardCardStore`. The store exposes no `reorderLists`/`setLists` action (see `src/lib/realtime/board-store.ts`). The subsequent `router.refresh()` fetches fresh `initialLists` props, but the `setInitial` effect is guarded by `lastBoardIdRef.current === boardId` and therefore never re-applies the refreshed order. Result: `storeLists` retains the stale order and the dragged list reverts.

2. **No realtime broadcast.** `reorderListsAction` (`src/lib/actions/lists/reorder.ts`) persists positions and calls `revalidatePath`, but never calls `emitToBoard`. There is no `LIST_REORDERED` event in `REALTIME_EVENTS` (`src/lib/realtime/types.ts`) and no corresponding listener in `src/lib/realtime/use-board-socket.ts`. Result: other connected users never observe list reorders.

By contrast, card reordering (`moveCardAction` / `reorderCardsAction`) follows the correct pattern: an optimistic store update (`useBoardCardStore.getState().moveCard(...)`) plus a Socket.io broadcast (`emitToBoard(..., CARD_MOVED, ...)`). The list path is missing both.

## Functional Requirements

### FR-1: Optimistic local update on list reorder

- When a user drags a list to a new position and releases it, the local board store (`useBoardCardStore`) MUST be updated immediately to reflect the new order (optimistic update), so the UI does not revert.
- A new store action (e.g., `reorderLists(orderedListIds)`) MUST reorder the `lists` array in place.
- The `handleDragEnd` list branch in `board-cards.tsx` MUST call this store action when a list is reordered, mirroring the card branch's call to `moveCard`.

### FR-2: Server reconciliation on failure

- If `reorderListsAction` returns errors or rejects, the store MUST be reconciled back to the last-known-correct order (e.g., via `router.refresh()` or revert), and an error toast MUST be shown. This matches the existing card-reorder error-handling pattern.

### FR-3: Realtime broadcast of list reorders

- `reorderListsAction` MUST emit a `list:reordered` event to the board room via `emitToBoard(boardId, REALTIME_EVENTS.LIST_REORDERED, payload)` after a successful DB write, consistent with card actions.
- The payload MUST include `boardId` and `orderedListIds: string[]`.

### FR-4: Realtime application on collaborating clients

- A new `LIST_REORDERED` event constant and `ListsReorderedPayload` type MUST be added to `src/lib/realtime/types.ts`.
- `useBoardSocket` MUST register a listener for `LIST_REORDERED` that calls the new store `reorderLists` action when `payload.boardId === boardId`.
- The acting user's own broadcast echo SHOULD NOT cause a double-apply visual glitch (the optimistic update already applied locally; the echo must be idempotent).

## Non-Functional Requirements

- **Performance:** The optimistic update MUST be synchronous so there is no visible flicker; the list remains at the dropped position. Realtime propagation to other clients SHOULD occur within the project's sub-100ms real-time target where the network allows.
- **Consistency:** The fix MUST follow the existing card-reorder pattern (optimistic store update + Socket.io broadcast + reconciliation) to keep the codebase uniform.
- **Type safety:** All new event constants, payload types, and store actions MUST be fully typed (TypeScript). No `any`.
- **Test coverage:** Per `conductor/workflow.md` (TDD, >=80% coverage), the store action, action-layer broadcast, and socket listener MUST be covered by Vitest unit/integration tests, and the reorder flow MUST be covered by a Playwright E2E test.

## Acceptance Criteria

- **AC-1:** A user can drag a list to a new horizontal position; on release, the list stays at the new position without snapping back. The order persists across a hard page reload.
- **AC-2:** A second client viewing the same board sees the list reorder in real time within ~100ms of the first user dropping the list (no manual refresh required).
- **AC-3:** If the server rejects the reorder (e.g., validation error or thrown error), the list reverts to its prior position and an error toast is displayed.
- **AC-4:** Vitest unit/integration tests exist and pass for: the new `reorderLists` store action; `reorderListsAction` emitting `LIST_REORDERED`; and the `useBoardSocket` `LIST_REORDERED` listener.
- **AC-5:** A Playwright E2E test proves a list drag persists for the acting user (and, where feasible in the test harness, syncs to a second browser context).
- **AC-6:** `npm run lint`, `npm run typecheck`, and `npm test` all pass.

## Out of Scope

- Card reordering and card move logic (already working; used only as the reference pattern).
- List create/rename/delete flows (unaffected).
- Database schema changes to the `lists` table (the existing `position` column and `reorderLists` data layer are correct and unchanged).
- Organization/team/permissions hierarchy (deferred per product.md MVP scope).
- Reordering lists across boards (lists are scoped to a single board).
