# Implementation Plan: Fix List Reordering Bug

Methodology: Test-Driven Development (per `conductor/workflow.md`). Each task follows: write tests → verify they fail → implement → verify tests pass → commit. Commit messages use `<type>(<scope>): <description>` in imperative, present tense.

## Phase 1: Realtime Event Types & Store Action (Foundation)

- [x] Task: Define `LIST_REORDERED` event constant and `ListsReorderedPayload` type
  - [x] Write tests asserting `REALTIME_EVENTS.LIST_REORDERED === "list:reordered"` and that `ListsReorderedPayload` carries `{ boardId: string; orderedListIds: string[] }`
  - [x] Implement: add `LIST_REORDERED: "list:reordered"` to `REALTIME_EVENTS` and export `ListsReorderedPayload` in `src/lib/realtime/types.ts`
  - [x] Verify all tests pass (`npm test`)
  - [x] Commit the change (`fix(realtime): add LIST_REORDERED event type`)

- [x] Task: Add `reorderLists(orderedListIds)` action to the board store
  - [x] Write unit tests for `useBoardCardStore.reorderLists`: reorders `lists` to match `orderedListIds`; reassigns sequential `position` values; ignores ids not present; is idempotent for the same order
  - [x] Implement `reorderLists` in `src/lib/realtime/board-store.ts` (reorder the `lists` array by id and reindex `position`)
  - [x] Verify all tests pass (`npm test`)
  - [x] Commit the change (`fix(realtime): add reorderLists store action`)

- [x] Task: Conductor - User Manual Verification 'Realtime Event Types & Store Action (Foundation)' (Protocol in workflow.md)

## Phase 2: Server Action Broadcast

- [x] Task: Emit `LIST_REORDERED` from `reorderListsAction` on success
  - [x] Write/extend tests in `src/lib/actions/lists/__tests__/actions.test.ts`: assert `emitToBoard` is called with `(boardId, REALTIME_EVENTS.LIST_REORDERED, { boardId, orderedListIds })` after a successful reorder; assert it is NOT called on validation error or thrown error
  - [x] Implement in `src/lib/actions/lists/reorder.ts`: import `emitToBoard` + `REALTIME_EVENTS`, call `emitToBoard(boardId, REALTIME_EVENTS.LIST_REORDERED, { boardId, orderedListIds })` after the successful DB write
  - [x] Verify all tests pass (`npm test`)
  - [x] Commit the change (`fix(lists): broadcast list reorders over socket.io`)

- [x] Task: Conductor - User Manual Verification 'Server Action Broadcast' (Protocol in workflow.md)

## Phase 3: Client Wiring — Optimistic Update & Socket Listener

- [x] Task: Optimistic store update + error reconciliation in `handleDragEnd` list branch
  - [x] Write/extend component tests in `src/components/cards/__tests__/board-cards-dnd.test.tsx`: after dragging a list, assert the store `lists` order updates optimistically (list stays at the dropped position); when `reorderListsAction` rejects/returns errors, assert the order reverts and a toast is shown
  - [x] Implement in `src/components/cards/board-cards.tsx` `handleDragEnd` (list branch): call `useBoardCardStore.getState().reorderLists(next.map((l) => l.id))` alongside `reorderListsAction`; on error, reconcile via `router.refresh()` and show toast; stop relying on `router.refresh()` for the success case
  - [x] Verify all tests pass (`npm test`)
  - [x] Commit the change (`fix(lists): optimistic update on list reorder`)

- [x] Task: Register `LIST_REORDERED` listener in `useBoardSocket`
  - [x] Write unit tests for `useBoardSocket`: on `LIST_REORDERED` with matching `boardId`, assert `useBoardCardStore.reorderLists` is called with `payload.orderedListIds`; with non-matching `boardId`, assert it is NOT called
  - [x] Implement in `src/lib/realtime/use-board-socket.ts`: add `socket.on(REALTIME_EVENTS.LIST_REORDERED, ...)` that calls `useBoardCardStore.getState().reorderLists(payload.orderedListIds)` when `payload.boardId === boardId`
  - [x] Verify all tests pass (`npm test`)
  - [x] Commit the change (`fix(realtime): apply list reorders from socket events`)

- [x] Task: Conductor - User Manual Verification 'Client Wiring — Optimistic Update & Socket Listener' (Protocol in workflow.md)

## Phase 4: End-to-End Verification

- [x] Task: Playwright E2E test for list reorder persistence and realtime sync
  - [x] Write E2E test in `e2e/`: log in, open a board with >=2 lists, drag list A before list B, assert the new order persists (no snap-back) and survives a page reload; in a second browser context on the same board, assert the reorder syncs without a manual refresh
  - [x] Run E2E (`npm run test:e2e`); fix any flakiness or defects the test reveals
  - [x] Verify all tests pass (`npm test` and `npm run test:e2e`)
  - [x] Commit the change (`test(lists): e2e for list reorder persistence and realtime sync`)

- [x] Task: Conductor - User Manual Verification 'End-to-End Verification' (Protocol in workflow.md)
