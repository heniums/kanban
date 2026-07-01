# Specification: Integration Test Data Cleanup

## Overview

This track addresses the lack of systematic test data cleanup across both Vitest and Playwright test suites. Currently, integration tests that interact with the real database leave orphaned rows (users, boards, lists, cards, etc.), and E2E tests accumulate registered users with zero cleanup. The goal is to establish a shared, reusable test data factory system with per-suite automatic cleanup.

## Current State

- **4 Vitest integration test files** have ad-hoc `afterAll` cleanup (lists, cards, boards create-with-default-list, seed). Each duplicates the same pattern of tracking test emails and deleting cascading rows.
- **E2E Playwright tests** (lists, board-hero, realtime) register users via the UI but never clean them up, leaving orphaned users and their boards/cards in the database.
- **No shared test utilities** exist — no factory classes, no fixture helpers, no central DB seed/cleanup logic.
- **Schema tests** are read-only (query `information_schema`) and not affected.
- **Mock-based tests** use `vi.mock` and don't touch the database, so they're unaffected.

## Functional Requirements

### FR-1: Shared Test Factory for Vitest

- Create a `TestDataFactory` that wraps the Drizzle ORM `db` instance and tracks all created database rows (users, boards, lists, cards, etc.) in an internal registry.
- Provide factory methods: `createUser()`, `createBoard()`, `createList()`, `createCard()` (and any other needed entity).
- Each factory method inserts via Drizzle and registers the created row for cleanup.
- Factory exports a `cleanup()` method that deletes all tracked rows in reverse order (respecting FK constraints).
- Factory exports a `registerCleanup()` helper that calls `cleanup()` in `afterAll` so each test file can use a one-liner.

### FR-2: Migrate Existing Vitest Integration Tests

- Replace ad-hoc inline insert + email-tracking patterns in these files with the shared factory:
  - `src/lib/data/lists/__tests__/integration.test.ts`
  - `src/lib/data/cards/__tests__/integration.test.ts`
  - `src/lib/data/boards/__tests__/create-with-default-list.test.ts`
  - `src/scripts/__tests__/seed.test.ts`
- Ensure each file uses `registerCleanup()` in `afterAll`.

### FR-3: E2E Playwright Test Cleanup

- Create a shared E2E utility module (e.g., `e2e/utils.ts`) that consolidates duplicated `registerUser` and `createBoard` helpers.
- Add a `cleanupE2EUser()` function that deletes the test user and all their associated data from the database (using the same Drizzle client/server action path).
- Wire cleanup into all 3 stateful E2E spec files (`lists.spec.ts`, `board-hero.spec.ts`, `realtime.spec.ts`) via `test.afterAll`.

### FR-4: Per-Suite Cleanup Strategy

- All cleanup is per-suite (`afterAll`), not per-test (`afterEach`), to balance test isolation with performance.
- Each test file creates its own factory instance and registers its own cleanup hook.

## Non-Functional Requirements

- **Performance:** Cleanup must not add more than 2 seconds per test file.
- **Reliability:** Cleanup must gracefully handle rows that were already deleted (no hard failures).
- **No breaking changes:** All existing tests must continue to pass with the new factory.

## Acceptance Criteria

1. **AC-1:** A shared `TestDataFactory` exists with `createUser`, `createBoard`, `createList`, `createCard` methods and a `cleanup()` method.
2. **AC-2:** All 4 real-DB Vitest integration test files are migrated to use the factory and register cleanup.
3. **AC-3:** E2E tests clean up registered users and their data via `test.afterAll`.
4. **AC-4:** E2E helper functions (`registerUser`, `createBoard`) are deduplicated into a shared `e2e/utils.ts`.
5. **AC-5:** Running `npm test` (Vitest) results in zero orphaned rows in the database.
6. **AC-6:** Running `npm run test:e2e` results in zero orphaned E2E users in the database.
7. **AC-7:** All existing tests pass (`npm test` and `npm run test:e2e`).
8. **AC-8:** Lint and typecheck pass (`npm run lint`, `npm run typecheck`).

## Out of Scope

- Transaction-based rollback instead of manual deletes (would require significant DB client restructuring).
- Global database seed/reset for the entire test suite.
- Parallel test isolation improvements beyond cleanup.
- Migrating mock-based tests (they don't touch the DB).
