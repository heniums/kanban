# Plan: card_dnd_fix_20260708

## Phase 1: Write Failing Tests

**Goal:** Establish reproduction tests that demonstrate the unique constraint failure before any code changes.

- [ ] Task: Write integration test — within-list reorder, move card from last position to first (`position 2 → 0`)
  - [ ] Create test user, board, list, and three cards at positions 0, 1, 2
  - [ ] Call `moveCard(cardAt2.id, sameListId, 0)`
  - [ ] Assert the move succeeds and final positions are `0, 1, 2` in correct order
  - [ ] Verify the test currently fails with `23505` unique constraint violation
- [ ] Task: Write integration test — within-list reorder, move card from first position to last (`position 0 → 2`)
  - [ ] Create test user, board, list, and three cards at positions 0, 1, 2
  - [ ] Call `moveCard(cardAt0.id, sameListId, 2)`
  - [ ] Assert the move succeeds and final positions are `0, 1, 2` in correct order
  - [ ] Verify the test currently fails with `23505` unique constraint violation
- [ ] Task: Write integration test — cross-list move to non-empty target list (`position 0`)
  - [ ] Create test user, board, two lists; add one card to source list and two cards to target list
  - [ ] Call `moveCard(sourceCard.id, targetListId, 0)`
  - [ ] Assert the move succeeds, source list is empty, and target list cards are at positions 0, 1, 2
  - [ ] Verify the test currently fails with `23505` unique constraint violation
- [ ] Task: Commit test additions with message `test(cards): Add failing integration tests for moveCard unique constraint bug`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Write Failing Tests' (Protocol in workflow.md)

## Phase 2: Fix moveCard Implementation

**Goal:** Refactor `moveCard` to use a two-pass position update strategy, eliminating temporary unique constraint violations during card shifts.

- [ ] Task: Refactor within-list path in `moveCard`
  - [ ] Replace single-pass `UPDATE position = position ± 1` with a two-pass approach:
    - First pass: set all affected cards to temporary negative positions
    - Second pass: set all affected cards to final zero-based positions
  - [ ] Ensure the moved card and all sibling cards in the list are updated atomically inside the transaction
  - [ ] Run within-list integration tests and confirm they pass
- [ ] Task: Refactor cross-list path in `moveCard`
  - [ ] Replace single-pass `UPDATE position = position ± 1` in source and target lists with two-pass approach
  - [ ] For source list: recompact remaining cards using temporary negative positions, then final positions
  - [ ] For target list: shift existing cards to make room using temporary negative positions, then final positions
  - [ ] Ensure the moved card’s `listId` and `position` are updated within the same transaction
  - [ ] Run cross-list integration tests (empty and non-empty target) and confirm they pass
- [ ] Task: Commit the fix with message `fix(cards): Use two-pass position updates in moveCard to avoid unique constraint violations`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Fix moveCard Implementation' (Protocol in workflow.md)

## Phase 3: Regression & Validation

**Goal:** Ensure the fix does not break any existing functionality and the codebase remains healthy.

- [ ] Task: Run full test suite (`npm test`) and verify 100% pass rate
- [ ] Task: Run typecheck (`npm run typecheck`) and verify zero errors
- [ ] Task: Run linter (`npm run lint`) and verify zero errors
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Regression & Validation' (Protocol in workflow.md)
