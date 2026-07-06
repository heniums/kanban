# Specification: Integration Test Database Cleanup via Transaction Rollback

## Overview

Integration tests currently leave test data in the PostgreSQL database, polluting it over time. The existing `TestDataFactory` class and inline cleanup logic in tests attempt to address this but are error-prone, inconsistent, and create maintenance overhead. This track replaces all manual cleanup with an automatic transaction rollback mechanism that wraps each integration test in a database transaction and rolls it back after completion, ensuring zero data persistence from tests.

## Problem Statement

- **Database Pollution:** Integration tests insert users, boards, lists, cards, labels, comments, checklists, and other entities into the database but do not reliably clean them up.
- **Inconsistent Cleanup:** Some tests use `TestDataFactory.registerCleanup()`, others inline `db.delete()` calls, and some omit cleanup entirely.
- **Shared State Risk:** Tests share mutable module-level variables (e.g., `testBoardId`, `testOwnerId`) across test cases, creating ordering dependencies and state leakage.
- **Factory Maintenance:** `TestDataFactory` tracks entity IDs and manually deletes them in reverse order, which is fragile and must be updated whenever new tables/schemas are added.

## Functional Requirements

### 1. Transaction Rollback Mechanism

- Provide a test utility that wraps each integration test in a PostgreSQL transaction.
- Automatically roll back the transaction after the test completes (pass or fail).
- Ensure the mechanism works with Drizzle ORM and the existing `pg` pool-based client.

### 2. Global Test Setup Integration

- Integrate the transaction rollback into the existing Vitest setup file (`src/__tests__/setup.ts`).
- Apply the rollback to all tests marked with a `@vitest-environment node` comment or residing in `src/lib/data/**` / `src/lib/actions/**` integration test paths.
- Do NOT apply transaction rollback to jsdom-based component tests (those tests do not touch the database).

### 3. Removal of Manual Cleanup

- **Delete `src/__tests__/test-factory.ts`** and its test file `src/__tests__/test-factory.test.ts`.
- **Refactor all integration tests** that currently use `TestDataFactory` to use the transaction-based approach.
- **Remove inline cleanup code** (e.g., `await db.delete(lists).where(eq(lists.boardId, boardId))`, `resetList()`, `registerCleanup()` calls) from integration tests.
- **Replace shared module-level state** (e.g., `testBoardId`, `testOwnerId`) with per-test setup that creates fresh data inside the rolled-back transaction.

### 4. Test Data Seeding Within Transactions

- Integration tests should create their required test data using standard Drizzle insert operations (or a lightweight helper if needed).
- Since all inserts happen inside a transaction that gets rolled back, no explicit cleanup is necessary.

### 5. Verification of Zero Data Leakage

- After running the full integration test suite, the database must contain no test-created artifacts.
- A verification query (e.g., `SELECT count(*) FROM users WHERE email LIKE '%@kanban.local'`) must return zero.

## Non-Functional Requirements

- **Performance:** Transaction rollback should add <50ms overhead per test compared to the current cleanup approach.
- **Reliability:** The mechanism must handle async tests, concurrent test execution (if applicable), and test failures without leaving data behind.
- **Maintainability:** No per-test cleanup code should remain after this track is complete.

## Acceptance Criteria

- [ ] `src/__tests__/test-factory.ts` and `src/__tests__/test-factory.test.ts` are deleted.
- [ ] All integration tests in `src/lib/data/**/__tests__/*.test.ts` run without leaving data in the database.
- [ ] All integration tests in `src/lib/actions/**/__tests__/*.test.ts` run without leaving data in the database.
- [ ] No inline `db.delete()` cleanup remains in any integration test.
- [ ] No `TestDataFactory` usage remains in any test.
- [ ] `npm test` passes with all tests green.
- [ ] A post-test database query confirms zero test data leakage.

## Out of Scope

- E2E tests (Playwright) — these run against a running server and require different cleanup strategies.
- Component tests using `jsdom` — these do not touch the database.
- Schema migrations or changes to production database logic.
- Performance benchmarking (beyond the <50ms overhead requirement).

## References

- Current cleanup utility: `src/__tests__/test-factory.ts`
- Vitest setup: `src/__tests__/setup.ts`
- Affected integration tests:
  - `src/lib/data/lists/__tests__/integration.test.ts`
  - `src/lib/data/cards/__tests__/integration.test.ts`
  - `src/lib/data/comments/__tests__/mutations.test.ts`
  - `src/lib/data/checklists/__tests__/mutations.test.ts`
  - `src/lib/data/labels/__tests__/labels.test.ts`
  - `src/lib/actions/*/__tests__/actions.test.ts`
  - `src/__tests__/authorized-middleware.test.ts`
  - `src/__tests__/authorize-direct-db.test.ts`
