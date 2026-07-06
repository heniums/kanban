# Implementation Plan: Socket.io Runtime Isolation Fix

## Phase 1: Fix Runtime Isolation Bug

- [ ] Task: Write tests for globalThis singleton pattern
  - [ ] Create test file `src/lib/realtime/__tests__/events.test.ts`
  - [ ] Test `setSocketServer()` stores instance on `globalThis.__io`
  - [ ] Test `emitToBoard()` reads from `globalThis.__io` and emits to correct room
  - [ ] Test `emitToBoard()` handles null/undefined `globalThis.__io` gracefully
  - [ ] Verify tests fail (TDD red phase)
- [ ] Task: Implement globalThis singleton pattern
  - [ ] Add TypeScript declaration for `globalThis.__io` in `events.ts`
  - [ ] Update `setSocketServer()` to assign to `globalThis.__io`
  - [ ] Update `emitToBoard()` to read from `globalThis.__io`
  - [ ] Verify tests pass (TDD green phase)
- [ ] Task: Verify implementation
  - [ ] Run `npm test` to ensure all tests pass
  - [ ] Run `npm run typecheck` to ensure no type errors
  - [ ] Run `npm run lint` to ensure code quality
  - [ ] Commit changes with message `fix(realtime): use globalThis for Socket.io singleton`
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Refactor State Management

- [ ] Task: Extend Zustand store for checklist updates
  - [ ] Add `updateChecklist(cardId: string)` action to `useBoardCardStore`
  - [ ] Write tests for the new action
  - [ ] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [ ] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [ ] Remove `board:checklist-updated` DOM event code
  - [ ] Verify tests pass and commit
- [ ] Task: Extend Zustand store for comment updates
  - [ ] Add `updateComments(cardId: string)` action to `useBoardCardStore`
  - [ ] Write tests for the new action
  - [ ] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [ ] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [ ] Remove `board:comment-updated` DOM event code
  - [ ] Verify tests pass and commit
- [ ] Task: Extend Zustand store for label updates
  - [ ] Add `updateLabel(label: { id: string; name: string; color: string })` action to `useBoardCardStore`
  - [ ] Write tests for the new action
  - [ ] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [ ] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [ ] Remove `board:label-updated` DOM event code
  - [ ] Verify tests pass and commit
- [ ] Task: Extend Zustand store for label deletions
  - [ ] Add `deleteLabel(labelId: string)` action to `useBoardCardStore`
  - [ ] Write tests for the new action
  - [ ] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [ ] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [ ] Remove `board:label-deleted` DOM event code
  - [ ] Verify tests pass and commit
- [ ] Task: Extend Zustand store for card label assignments
  - [ ] Add `updateCardLabels(cardId: string)` action to `useBoardCardStore`
  - [ ] Write tests for the new action
  - [ ] Update `use-board-socket.ts` to call store action instead of dispatching DOM event
  - [ ] Update `use-card-detail.ts` to subscribe to store instead of listening to DOM event
  - [ ] Remove `board:card-labels-updated` DOM event code
  - [ ] Verify tests pass and commit
- [ ] Task: Clean up remaining DOM event code
  - [ ] Remove `card:open` DOM event (replace with direct function call or store action)
  - [ ] Verify no remaining `window.dispatchEvent` or `window.addEventListener` calls in realtime code
  - [ ] Run full test suite and verify all tests pass
  - [ ] Commit cleanup with message `refactor(realtime): remove DOM event bus, use Zustand consistently`
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Add Comprehensive Unit Tests

- [ ] Task: Add unit tests for Zustand store actions
  - [ ] Write tests for `updateChecklist` action
  - [ ] Write tests for `updateComments` action
  - [ ] Write tests for `updateLabel` action
  - [ ] Write tests for `deleteLabel` action
  - [ ] Write tests for `updateCardLabels` action
  - [ ] Verify all tests pass
  - [ ] Commit with message `test(realtime): add unit tests for Zustand store actions`
- [ ] Task: Final verification
  - [ ] Run `npm test` to ensure all tests pass
  - [ ] Run `npm run typecheck` to ensure no type errors
  - [ ] Run `npm run lint` to ensure code quality
  - [ ] Manually test real-time updates in browser (card moves, label changes, etc.)
  - [ ] Commit any final fixes
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
