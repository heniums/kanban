# Implementation Plan: Integration Test Data Cleanup

Methodology: Test-Driven Development (per `conductor/workflow.md`). Each task follows: write tests → verify they fail → implement → verify tests pass → commit.

## Phase 1: Vitest Shared Test Factory

- [ ] Task: Create the TestDataFactory class
  - [ ] Write unit tests for `TestDataFactory` (test that `createUser` inserts and tracks, `createBoard` inserts and tracks, `cleanup` deletes all tracked rows in correct FK order)
  - [ ] Implement `src/lib/__tests__/test-factory.ts` with methods:
    - `createUser(overrides?: Partial<...>)` — insert user, return with id
    - `createBoard(overrides?: Partial<...>)` — insert board, return with id
    - `createList(overrides?: Partial<...>)` — insert list, return with id
    - `createCard(overrides?: Partial<...>)` — insert card, return with id
    - `cleanup()` — delete all tracked rows in reverse-insertion order
    - `registerCleanup()` — call in `afterAll` to auto-cleanup
  - [ ] Verify factory unit tests pass
  - [ ] Commit: `test(db): add shared TestDataFactory with self-cleanup`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Vitest Shared Test Factory' (Protocol in workflow.md)

## Phase 2: Migrate Vitest Integration Tests

- [ ] Task: Migrate lists integration test
  - [ ] Replace ad-hoc `TEST_EMAILS` tracking and manual inserts with `TestDataFactory`
  - [ ] Replace manual `afterAll` with `registerCleanup()`
  - [ ] Verify `npm test -- src/lib/data/lists` passes
  - [ ] Commit: `refactor(test): migrate lists integration test to shared TestDataFactory`

- [ ] Task: Migrate cards integration test
  - [ ] Replace ad-hoc `TEST_EMAILS` tracking and manual inserts with `TestDataFactory`
  - [ ] Replace manual `afterAll` with `registerCleanup()`
  - [ ] Verify `npm test -- src/lib/data/cards` passes
  - [ ] Commit: `refactor(test): migrate cards integration test to shared TestDataFactory`

- [ ] Task: Migrate boards create-with-default-list test
  - [ ] Replace ad-hoc `TEST_EMAILS` tracking and manual inserts with `TestDataFactory`
  - [ ] Replace manual `afterAll` with `registerCleanup()`
  - [ ] Verify `npm test -- src/lib/data/boards` passes
  - [ ] Commit: `refactor(test): migrate boards create-with-default-list test to shared TestDataFactory`

- [ ] Task: Migrate seed test
  - [ ] Replace ad-hoc `afterAll` with `TestDataFactory` + `registerCleanup()`
  - [ ] Verify `npm test -- src/scripts` passes
  - [ ] Commit: `refactor(test): migrate seed test to shared TestDataFactory`

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Migrate Vitest Integration Tests' (Protocol in workflow.md)

## Phase 3: E2E Cleanup & Shared Utilities

- [ ] Task: Create shared E2E utilities module
  - [ ] Create `e2e/utils.ts` with consolidated `registerUser(page)` and `createBoard(page, title)` helpers
  - [ ] Add `cleanupE2EUser(email)` that connects to DB via Drizzle client and deletes the test user + cascading data
  - [ ] Verify typecheck passes
  - [ ] Commit: `refactor(e2e): extract shared utilities and add DB cleanup helper`

- [ ] Task: Wire cleanup into lists.spec.ts
  - [ ] Import shared helpers from `e2e/utils.ts`
  - [ ] Remove duplicated `registerUser`/`createBoard` helpers
  - [ ] Add `test.afterAll` calling `cleanupE2EUser`
  - [ ] Verify `npx playwright test e2e/lists.spec.ts` passes
  - [ ] Commit: `test(e2e): add DB cleanup to lists E2E test`

- [ ] Task: Wire cleanup into board-hero.spec.ts
  - [ ] Import shared helpers from `e2e/utils.ts`
  - [ ] Remove duplicated helpers
  - [ ] Add `test.afterAll` calling `cleanupE2EUser`
  - [ ] Verify `npx playwright test e2e/board-hero.spec.ts` passes
  - [ ] Commit: `test(e2e): add DB cleanup to board-hero E2E test`

- [ ] Task: Wire cleanup into realtime.spec.ts
  - [ ] Import shared helpers from `e2e/utils.ts`
  - [ ] Remove duplicated helpers
  - [ ] Add `test.afterAll` calling `cleanupE2EUser`
  - [ ] Verify `npx playwright test e2e/realtime.spec.ts` passes
  - [ ] Commit: `test(e2e): add DB cleanup to realtime E2E test`

- [ ] Task: Conductor - User Manual Verification 'Phase 3: E2E Cleanup & Shared Utilities' (Protocol in workflow.md)

## Phase 4: Final Verification

- [ ] Task: Full test suite verification
  - [ ] Run `npm run typecheck` and verify no errors
  - [ ] Run `npm run lint` and verify no warnings/errors
  - [ ] Run `npm test` and verify all tests pass
  - [ ] Run `npm run test:e2e` and verify all E2E tests pass
  - [ ] Manually verify database has zero orphaned rows after test runs
  - [ ] Commit: `chore(test): final verification of test data cleanup`
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification' (Protocol in workflow.md)
