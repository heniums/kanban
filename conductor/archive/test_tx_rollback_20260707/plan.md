# Implementation Plan: Integration Test Database Cleanup via Transaction Rollback

## Phase 1: Transaction Rollback Infrastructure

### Goal

Build the core transaction rollback mechanism that wraps each integration test in a database transaction and automatically rolls it back.

- [x] Task: Write tests for the transaction rollback utility
  - [x] Test that a transaction is started before each test
  - [x] Test that the transaction is rolled back after a passing test
  - [x] Test that the transaction is rolled back after a failing test
  - [x] Test that Drizzle insert operations within the transaction are not persisted
- [x] Task: Implement transaction wrapper utility
  - [x] Create a helper that acquires a dedicated `pg` client from the pool
  - [x] Begin a transaction on that client before each test
  - [x] Provide a transactional Drizzle instance to the test
  - [x] Roll back the transaction in `afterEach` (or Vitest's `onTestFinished` hook)
  - [x] Release the client back to the pool
- [x] Task: Integrate transaction rollback into Vitest setup
  - [x] Update `src/__tests__/setup.ts` to conditionally apply transaction rollback for node-environment tests
  - [x] Ensure jsdom tests are unaffected
  - [x] Provide a global/helper to access the transactional database client in tests
- [x] Task: Verify all tests pass
  - [x] Run `npm test` and confirm no regressions
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

---

## Phase 2: Refactor Data Layer Integration Tests

### Goal

Remove `TestDataFactory` usage and inline cleanup from all data layer integration tests, replacing them with per-test setup inside the rolled-back transaction.

- [x] Task: Refactor `src/lib/data/lists/__tests__/integration.test.ts`
  - [x] Remove `TestDataFactory` import and usage
  - [x] Remove `registerCleanup()` and inline `db.delete()` calls
  - [x] Remove shared module-level state (`testBoardId`, `testOwnerId`, `ensureTestBoard()`)
  - [x] Create a lightweight helper (or inline setup) to seed a user + board + list per test within the transaction
  - [x] Update all test cases to use the new per-test setup
- [x] Task: Refactor `src/lib/data/cards/__tests__/integration.test.ts`
  - [x] Remove `TestDataFactory` import and usage
  - [x] Remove `registerCleanup()`, `resetList()`, and inline cleanup
  - [x] Remove shared module-level state
  - [x] Create per-test setup for user + board + list(s) + card(s)
  - [x] Update all test cases
- [x] Task: Refactor `src/lib/data/comments/__tests__/mutations.test.ts`
  - [x] Remove any `TestDataFactory` or manual cleanup usage
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/data/checklists/__tests__/mutations.test.ts`
  - [x] Remove any `TestDataFactory` or manual cleanup usage
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/data/labels/__tests__/labels.test.ts`
  - [x] Remove any `TestDataFactory` or manual cleanup usage
  - [x] Convert to per-test transaction-based setup
- [x] Task: Write tests for the new per-test setup helpers (if extracted)
  - [x] Verify helpers create valid entities
  - [x] Verify helpers work within a transaction
- [x] Task: Verify all tests pass
  - [x] Run `npm test` and confirm all data layer tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

---

## Phase 3: Refactor Action Layer and Remaining Integration Tests

### Goal

Apply the same transaction-based cleanup pattern to action layer tests and any other integration tests that touch the database.

- [x] Task: Refactor `src/lib/actions/lists/__tests__/actions.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/actions/boards/__tests__/actions.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/actions/members/__tests__/actions.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/actions/labels/__tests__/actions.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/lib/actions/auth/__tests__/register.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/__tests__/authorized-middleware.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Refactor `src/__tests__/authorize-direct-db.test.ts`
  - [x] Remove `TestDataFactory` or manual cleanup
  - [x] Convert to per-test transaction-based setup
- [x] Task: Verify all tests pass
  - [x] Run `npm test` and confirm all action layer and remaining tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

---

## Phase 4: Cleanup, Verification, and Finalization

### Goal

Remove deprecated utilities, verify zero data leakage, and commit all changes.

- [x] Task: Remove deprecated cleanup infrastructure
  - [x] Delete `src/__tests__/test-factory.ts`
  - [x] Delete `src/__tests__/test-factory.test.ts`
  - [x] Search codebase for any remaining `TestDataFactory` references and remove them
- [x] Task: Verify zero data leakage
  - [x] Run the full integration test suite
  - [x] Execute a verification query to confirm no test data remains (e.g., `SELECT count(*) FROM users WHERE email LIKE '%@kanban.local'`)
- [x] Task: Final test suite run
  - [x] Run `npm test` and confirm 100% pass rate
  - [x] Run `npm run typecheck` and confirm no type errors
  - [x] Run `npm run lint` and confirm no lint errors
- [x] Task: Commit all changes
  - [x] Stage all modified and deleted files
  - [x] Commit with message: `chore(tests): replace manual cleanup with transaction rollback`
- [x] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)
