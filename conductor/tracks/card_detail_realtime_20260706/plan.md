# Implementation Plan: Card Detail Modal Real-Time Updates

## Phase 1: Remove Dead Code

- [ ] Task: Remove CARD_LABELS_UPDATED event type
  - [ ] Remove `CARD_LABELS_UPDATED` from `REALTIME_EVENTS` in `src/lib/realtime/types.ts`
  - [ ] Remove `CardLabelsUpdatedPayload` type from `types.ts`
  - [ ] Remove `cardLabelsUpdatedEvent` state and actions from `src/lib/realtime/board-store.ts`
  - [ ] Remove `CARD_LABELS_UPDATED` listener from `src/lib/realtime/use-board-socket.ts`
  - [ ] Remove related tests from `src/lib/realtime/__tests__/use-board-socket.test.tsx`
  - [ ] Remove related tests from `src/lib/realtime/__tests__/board-store.test.ts`
  - [ ] Run `npm test` to ensure all tests pass
  - [ ] Run `npm run typecheck` to ensure no type errors
  - [ ] Commit changes with message `refactor(realtime): remove dead CARD_LABELS_UPDATED code`
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Implement Card Detail Real-Time Updates

- [ ] Task: Write tests for card detail real-time updates (TDD red phase)
  - [ ] Create test file `src/components/cards/card-detail/__tests__/use-card-detail-realtime.test.ts`
  - [ ] Test that card detail modal subscribes to CARD_UPDATED events
  - [ ] Test that modal state updates when CARD_UPDATED arrives for open card
  - [ ] Test that dirty draft fields are preserved when remote update arrives
  - [ ] Test that clean fields are updated from payload
  - [ ] Verify tests fail (TDD red phase)
- [ ] Task: Implement card detail real-time subscription
  - [ ] Add subscription to `CARD_UPDATED` events in `use-card-detail.ts`
  - [ ] Implement logic to update modal state from payload
  - [ ] Preserve dirty draft fields (don't overwrite if user has unsaved changes)
  - [ ] Update clean fields from payload (title, description, due date, labels, assignees)
  - [ ] Update checklist progress and comment count from payload
  - [ ] Verify tests pass (TDD green phase)
  - [ ] Run `npm test` to ensure all tests pass
  - [ ] Run `npm run typecheck` to ensure no type errors
  - [ ] Commit changes with message `feat(realtime): add real-time updates to card detail modal`
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Final Verification and Cleanup

- [ ] Task: Add comprehensive tests
  - [ ] Test edge cases: card closed when update arrives
  - [ ] Test edge cases: multiple rapid updates
  - [ ] Verify no `CARD_LABELS_UPDATED` references remain in codebase
  - [ ] Run full test suite
  - [ ] Run `npm run lint` to ensure code quality
  - [ ] Commit any final fixes with message `test(realtime): add comprehensive tests for card detail real-time updates`
- [ ] Task: Manual testing
  - [ ] Open card detail modal in two browser tabs
  - [ ] Update card in one tab, verify other tab updates
  - [ ] Test with unsaved changes (dirty draft preservation)
  - [ ] Test all field types: title, description, due date, labels, assignees
  - [ ] Verify checklist progress and comment count update
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
