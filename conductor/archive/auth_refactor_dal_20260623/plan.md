# Implementation Plan: Auth Refactor — Data Access Layer & Middleware Fix

## Track ID

`auth_refactor_dal_20260623`

---

## Phase 1: Add the Data Access Layer (DAL)

- [x] Task: Add `verifySession()` helper to `apps/web/src/lib/dal.ts`
  - [x] Write tests: `apps/web/src/lib/dal/__tests__/dal.test.ts` — verifies (a) `verifySession()` calls `auth()`, (b) redirects to `/login` when no session, (c) returns `{ userId }` when session present, (d) `dal.ts` imports `'server-only'`
  - [x] Implement: create `lib/dal.ts` with the cache-wrapped `verifySession()` function per FR1
  - [x] Verify all tests pass and `npm run typecheck` is clean
- [x] Task: Conductor - User Manual Verification 'Phase 1: Add the Data Access Layer (DAL)' (Protocol in workflow.md)

## Phase 2: Fix the security bug in the middleware `authorized` callback

- [x] Task: Add a regression test that demonstrates the bug
  - [x] Write tests: `apps/web/src/__tests__/authorized-middleware.test.ts` — invokes the `authorized` callback from `apps/web/src/auth.ts` with `nextUrl.pathname = "/boards/new"`, `"/boards"`, `"/boards/abc-123"` and `auth = null`. Asserts the return value is a `Response` with a redirect to `/login`. Also asserts `/login` and `/` return `true`.
  - [x] Verify the test FAILS on the current broken code (confirms the bug is detected)
- [x] Task: Replace `PUBLIC_ROUTES` with `PROTECTED_PREFIXES` in `apps/web/src/auth.ts`
  - [x] Implement: per FR2, swap the negative-list logic for a positive list
  - [x] Verify the regression test now PASSES and all existing tests still pass
- [x] Task: Conductor - User Manual Verification 'Phase 2: Fix the security bug in the middleware `authorized` callback' (Protocol in workflow.md)

## Phase 3: Rename `middleware.ts` to `proxy.ts`

- [x] Task: Rename the file and update the export
  - [x] Implement: `git mv apps/web/middleware.ts apps/web/proxy.ts`; change `export { auth as middleware }` to `export { auth as proxy }`; matcher unchanged
  - [x] Verify all tests still pass; search the codebase for any imports referencing the old `middleware` export name and update them
  - [x] Manual verify in dev: server starts, auth still works
- [x] Task: Conductor - User Manual Verification 'Phase 3: Rename `middleware.ts` to `proxy.ts`' (Protocol in workflow.md)

## Phase 4: Refactor existing board pages to use the DAL

- [x] Task: Update `apps/web/src/app/boards/page.tsx` to call `verifySession()`
  - [x] Update test: `boards-page.test.tsx` mocks `@/lib/dal` (not `@/auth`); `verifySession` mocked to return `{ userId: "user-1" }`
  - [x] Implement: replace inline `auth() + redirect()` with `const { userId } = await verifySession();`; remove unused `auth` import and `redirect` import if no longer used
  - [x] Verify all tests pass
- [x] Task: Update `apps/web/src/app/boards/[boardId]/page.tsx` to call `verifySession()`
  - [x] Update test: `board-page.test.tsx` mocks `@/lib/dal` (not `@/auth`); `verifySession` mocked to return `{ userId: "user-1" }`
  - [x] Implement: replace inline `auth() + redirect()` with `const { userId } = await verifySession();`; remove unused imports
  - [x] Verify all tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 4: Refactor existing board pages to use the DAL' (Protocol in workflow.md)

## Phase 5: Restructure `/boards/new` as server page + client form

- [x] Task: Extract the form into a client component
  - [x] Write tests: rename `apps/web/src/__tests__/new-board-page.test.tsx` (or update in place) to import and render `<NewBoardForm />` from `components/boards/new-board-form.tsx`; all assertions stay semantically equivalent
  - [x] Implement: move the form body from `app/boards/new/page.tsx` into `components/boards/new-board-form.tsx` (`"use client"`). Export `NewBoardForm` as default. Imports and behavior are identical to today's page minus the top-level form.
  - [x] Verify the extracted component's tests pass
- [x] Task: Make the page a server component
  - [x] Implement: rewrite `apps/web/src/app/boards/new/page.tsx` as a server component that calls `verifySession()` and renders `<NewBoardForm />`. Remove the `"use client"` directive. Result: a ~6-line file.
  - [x] Verify all tests still pass
- [x] Task: Conductor - User Manual Verification 'Phase 5: Restructure `/boards/new` as server page + client form' (Protocol in workflow.md)

## Phase 6: Remove `getSessionUserId()` and migrate Server Actions

- [x] Task: Update Server Action tests to mock `verifySession` instead of `getSessionUserId`
  - [x] Update test: `apps/web/src/lib/actions/boards/__tests__/actions.test.ts` — change the `@/lib/actions/boards` mock or the `./auth` mock to mock `@/lib/dal`'s `verifySession`
  - [x] Verify the test still passes (or fails appropriately if internals change in the next task)
- [x] Task: Update each of the 6 board Server Actions to use `verifySession`
  - [x] Implement: in each of `create.ts`, `get.ts`, `list.ts`, `update.ts`, `delete.ts`, `restore.ts` in `apps/web/src/lib/actions/boards/`, replace the `import { getSessionUserId } from "./auth"` line with `import { verifySession } from "@/lib/dal"`. Change `const userId = await getSessionUserId();` to `const { userId } = await verifySession();`
  - [x] Verify the actions' tests pass
- [x] Task: Delete the old `getSessionUserId()` helper
  - [x] Implement: remove `apps/web/src/lib/actions/boards/auth.ts`
  - [x] Verify all tests pass and `npm run typecheck` is clean (catches any forgotten import)
- [x] Task: Conductor - User Manual Verification 'Phase 6: Remove `getSessionUserId()` and migrate Server Actions' (Protocol in workflow.md)

## Phase 7: Final verification and cleanup

- [x] Task: Run full test suite, typecheck, and lint across all workspaces
  - [x] Verify: `npm test` passes across all 3 workspaces
  - [x] Verify: `npm run typecheck` passes across all 3 workspaces
  - [x] Verify: `npm run lint -w apps/web` and `npm run lint -w apps/server` pass
- [x] Task: Manual end-to-end smoke test
  - [x] Verify: unauthenticated GET to `/boards` redirects to `/login`
  - [x] Verify: unauthenticated GET to `/boards/new` redirects to `/login`
  - [x] Verify: unauthenticated GET to `/boards/[any-id]` redirects to `/login`
  - [x] Verify: log in, create a board, view dashboard, open the board, edit settings, delete + undo — all work
- [x] Task: Conductor - User Manual Verification 'Phase 7: Final verification and cleanup' (Protocol in workflow.md)
