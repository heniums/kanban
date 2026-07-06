# Implementation Plan: Card Detail Modal Real-Time Updates

## Phase 1: Remove Dead Code

- [x] Task: Remove CARD_LABELS_UPDATED event type
  - [x] Remove `CARD_LABELS_UPDATED` from `REALTIME_EVENTS` in `src/lib/realtime/types.ts`
  - [x] Remove `CardLabelsUpdatedPayload` type from `types.ts`
  - [x] Remove `cardLabelsUpdatedEvent` state and actions from `src/lib/realtime/board-store.ts`
  - [x] Remove `CARD_LABELS_UPDATED` listener from `src/lib/realtime/use-board-socket.ts`
  - [x] Remove related tests from `src/lib/realtime/__tests__/use-board-socket.test.tsx`
  - [x] Remove related tests from `src/lib/realtime/__tests__/board-store.test.ts`
  - [x] Run `npm test` to ensure all tests pass
  - [x] Run `npm run typecheck` to ensure no type errors
  - [x] Commit changes with message `refactor(realtime): remove dead CARD_LABELS_UPDATED code`
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Implement Card Detail Real-Time Updates

- [x] Task: Write tests for card detail real-time updates (TDD red phase)
  - [x] Create test file `src/components/cards/card-detail/__tests__/use-card-detail-realtime.test.ts`
  - [x] Test that card detail modal subscribes to CARD_UPDATED events
  - [x] Test that modal state updates when CARD_UPDATED arrives for open card
  - [x] Test that dirty draft fields are preserved when remote update arrives
  - [x] Test that clean fields are updated from payload
  - [x] Verify tests fail (TDD red phase)
- [x] Task: Implement card detail real-time subscription
  - [x] Add subscription to `CARD_UPDATED` events in `use-card-detail.ts`
  - [x] Implement logic to update modal state from payload
  - [x] Preserve dirty draft fields (don't overwrite if user has unsaved changes)
  - [x] Update clean fields from payload (title, description, due date, labels)
  - [x] Update checklist progress and comment count from payload
  - [x] Verify tests pass (TDD green phase)
  - [x] Run `npm test` to ensure all tests pass
  - [x] Run `npm run typecheck` to ensure no type errors
  - [x] Commit changes with message `feat(realtime): add real-time updates to card detail modal`
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Final Verification and Cleanup

- [x] Task: Add comprehensive tests
  - [x] Test edge cases: card closed when update arrives
  - [x] Test edge cases: multiple rapid updates
  - [x] Verify no `CARD_LABELS_UPDATED` references remain in codebase
  - [x] Run full test suite
  - [x] Run `npm run lint` to ensure code quality
  - [x] Commit any final fixes with message `test(realtime): add comprehensive tests for card detail real-time updates`
- [x] Task: Manual testing
  - [x] Open card detail modal in two browser tabs
  - [x] Update card in one tab, verify other tab updates
  - [x] Test with unsaved changes (dirty draft preservation)
  - [x] Test all field types: title, description, due date, labels
  - [x] Verify checklist progress and comment count update
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
