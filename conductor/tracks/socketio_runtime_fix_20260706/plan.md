# Implementation Plan: Socket.io Runtime Isolation Fix

## Phase 1: Fix Runtime Isolation Bug

- [x] Task: Write tests for globalThis singleton pattern
  - [x] Create test file `src/lib/realtime/__tests__/events.test.ts`
  - [x] Test `setSocketServer()` stores instance on `globalThis.__io`
  - [x] Test `emitToBoard()` reads from `globalThis.__io` and emits to correct room
  - [x] Test `emitToBoard()` handles null/undefined `globalThis.__io` gracefully
  - [x] Verify tests fail (TDD red phase)
- [x] Task: Implement globalThis singleton pattern
  - [x] Add TypeScript declaration for `globalThis.__io` in `events.ts`
  - [x] Update `setSocketServer()` to assign to `globalThis.__io`
  - [x] Update `emitToBoard()` to read from `globalThis.__io`
  - [x] Verify tests pass (TDD green phase)
- [x] Task: Verify implementation
  - [x] Run `npm test` to ensure all tests pass
  - [x] Run `npm run typecheck` to ensure no type errors
  - [x] Run `npm run lint` to ensure code quality
  - [x] Commit changes with message `fix(realtime): use globalThis for Socket.io singleton`
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Refactor State Management

- [x] Task: Extend Zustand store for checklist updates
  - [x] Add `updateChecklist(cardId: string)` action to `useBoardCardStore`
  - [x] Write tests for the new action
  - [x] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [x] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [x] Remove `board:checklist-updated` DOM event code
  - [x] Verify tests pass and commit
- [x] Task: Extend Zustand store for comment updates
  - [x] Add `updateComments(cardId: string)` action to `useBoardCardStore`
  - [x] Write tests for the new action
  - [x] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [x] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [x] Remove `board:comment-updated` DOM event code
  - [x] Verify tests pass and commit
- [x] Task: Extend Zustand store for label updates
  - [x] Add `updateLabel(label: { id: string; name: string; color: string })` action to `useBoardCardStore`
  - [x] Write tests for the new action
  - [x] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [x] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [x] Remove `board:label-updated` DOM event code
  - [x] Verify tests pass and commit
- [x] Task: Extend Zustand store for label deletions
  - [x] Add `deleteLabel(labelId: string)` action to `useBoardCardStore`
  - [x] Write tests for the new action
  - [x] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [x] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [x] Remove `board:label-deleted` DOM event code
  - [x] Verify tests pass and commit
- [x] Task: Extend Zustand store for card label assignments
  - [x] Add `updateCardLabels(cardId: string)` action to `useBoardCardStore`
  - [x] Write tests for the new action
  - [x] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [x] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [x] Remove `board:card-labels-updated` DOM event code
  - [x] Verify tests pass and commit
- [x] Task: Clean up remaining DOM event code
  - [x] Remove `card:open` DOM event (replace with direct function call or store action)
  - [x] Verify no remaining `window.dispatchEvent` or `window.addEventListener` calls in realtime code
  - [x] Run full test suite and verify all tests pass
  - [x] Commit cleanup with message `refactor(realtime): remove DOM event bus, use Zustand consistently`
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Add Comprehensive Unit Tests

- [x] Task: Add unit tests for Zustand store actions
  - [x] Write tests for `updateChecklist` action
  - [x] Write tests for `updateComments` action
  - [x] Write tests for `updateLabel` action
  - [x] Write tests for `deleteLabel` action
  - [x] Write tests for `updateCardLabels` action
  - [x] Verify all tests pass
  - [x] Commit with message `test(realtime): add unit tests for Zustand store actions`
- [x] Task: Final verification
  - [x] Run `npm test` to ensure all tests pass
  - [x] Run `npm run typecheck` to ensure no type errors
  - [x] Run `npm run lint` to ensure code quality
  - [x] Manually test real-time updates in browser (card moves, label changes, etc.)
  - [x] Commit any final fixes
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions 31fff92
