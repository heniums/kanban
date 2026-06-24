# Specification: Auth Refactor — Data Access Layer & Middleware Fix

## Track ID

`auth_refactor_dal_20260623`

## Overview

This track fixes a real security bug and refactors the authentication code to follow the Next.js 16 official guidance for App Router authentication.

**Security bug.** The `authorized` callback in `apps/web/src/auth.ts` is broken: it uses `PUBLIC_ROUTES.some(p => pathname.startsWith(p))` against a list that includes `"/"`, and every URL starts with `"/"`. As a result, `isProtected` is always `false`, the middleware returns `true` (allow) for every request, and unauthenticated users can access any route the matcher covers. The only thing currently keeping `/boards` and `/boards/[boardId]` from being open is the inline `auth() + redirect()` block duplicated in each page. `/boards/new`, a client component, has no such block — the visible symptom.

**Structural fix.** Adopt the Data Access Layer (DAL) pattern recommended in the Next.js authentication guide: a single `verifySession()` helper that calls `auth()`, redirects to `/login` if no session, and is wrapped in React's `cache()` so it deduplicates per render pass. Pages, Server Actions, and the data layer all consume this one source of truth.

**Next.js 16 alignment.** Rename `middleware.ts` to `proxy.ts` (the new convention in Next.js 16) and verify the rename preserves all auth behavior.

## Context & Constraints

- **Tech stack:** Next.js 16.2.9 (App Router, RSC, Partial Rendering), NextAuth v5 (Auth.js), React 19, TypeScript strict, Vitest.
- **Auth model:** Credentials provider, JWT session strategy, session cookie read by middleware (edge) and `auth()` (Node).
- **Current state:**
  - `apps/web/middleware.ts` matcher is correct; the `authorized` callback in `apps/web/src/auth.ts` is the broken part.
  - `apps/web/src/lib/actions/boards/auth.ts` exports `getSessionUserId()` used by 6 board Server Actions.
  - `apps/web/src/lib/data/boards/*.ts` take `ownerId` as a required parameter (review-fixed in track `board_mgmt_20260620`).
  - `apps/web/src/app/boards/page.tsx` and `[boardId]/page.tsx` have inline `auth() + redirect()` blocks.
  - `apps/web/src/app/boards/new/page.tsx` is a `"use client"` page with no auth check.
- **No new dependencies. No lockfile change.**
- **No URL changes.**
- **No data layer signature changes for board CRUD** — `ownerId` is already required.

## Functional Requirements

### FR1 — Add Data Access Layer (DAL) helper

Create `apps/web/src/lib/dal.ts` with one export:

```ts
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return { userId: session.user.id };
});
```

- Uses React's `cache()` so multiple calls in the same render pass dedupe to a single `auth()` call.
- Returns `{ userId: string }` on success.
- Calls `redirect('/login')` on failure.
- Marked `'server-only'` so it cannot be imported by a client component by mistake.

### FR2 — Fix middleware `authorized` callback

Replace the broken negative-list logic in `apps/web/src/auth.ts` with a positive list of protected prefixes:

```ts
const PROTECTED_PREFIXES = ['/boards'];

callbacks: {
  authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;
    const isProtected = PROTECTED_PREFIXES.some((p) =>
      nextUrl.pathname.startsWith(p)
    );
    if (isProtected && !isLoggedIn) {
      return Response.redirect(new URL('/login', nextUrl));
    }
    return true;
  },
  ...
},
```

- The `PUBLIC_ROUTES` export is removed.
- The matcher in `middleware.ts` is unchanged.

### FR3 — Refactor pages to use the DAL

Replace the inline `auth() + redirect()` block in:

- `apps/web/src/app/boards/page.tsx`
- `apps/web/src/app/boards/[boardId]/page.tsx`

with:

```ts
const { userId } = await verifySession();
```

The `auth` import is removed from each file. Page logic is otherwise unchanged.

### FR4 — Restructure `/boards/new` as server page + client form

- Extract the form body from `apps/web/src/app/boards/new/page.tsx` into a new file `apps/web/src/components/boards/new-board-form.tsx` (`"use client"`). The form's exports, props, and behavior are identical to today.
- The page becomes a server component:

  ```tsx
  import { verifySession } from '@/lib/dal';
  import { NewBoardForm } from '@/components/boards/new-board-form';

  export default async function NewBoardPage() {
    await verifySession();
    return <NewBoardForm />;
  }
  ```

- The existing `apps/web/src/__tests__/new-board-page.test.tsx` is updated to render `<NewBoardForm />` directly.

### FR5 — Remove `getSessionUserId()` and update Server Actions

- Delete `apps/web/src/lib/actions/boards/auth.ts`.
- Update each of the 6 board Server Actions to import `verifySession` from `@/lib/dal` and destructure `userId`:
  - `createBoardAction`, `getBoardAction`, `listBoardsAction`, `updateBoardAction`, `deleteBoardAction`, `restoreBoardAction` in `apps/web/src/lib/actions/boards/`.
- Each action's first line changes from `const userId = await getSessionUserId();` to:

  ```ts
  const { userId } = await verifySession();
  ```

### FR6 — Tests

Add:

- `apps/web/src/lib/dal/__tests__/dal.test.ts` — verifies `verifySession()` redirects on no session and returns `{ userId }` on success. Uses `vi.mock` to control `auth()`.
- `apps/web/src/__tests__/authorized-middleware.test.ts` — regression test for the middleware `authorized` callback. Asserts that for path `/boards/new` with no auth, the callback returns a redirect to `/login`. Prevents the prefix bug from coming back.
- Update `apps/web/src/__tests__/new-board-page.test.tsx` to test `<NewBoardForm />` directly.
- Update `boards-page.test.tsx` and `board-page.test.tsx` to mock `verifySession` instead of `auth`.
- Update `apps/web/src/lib/actions/boards/__tests__/actions.test.ts` to mock `verifySession` instead of `getSessionUserId`.

### FR7 — No matcher change

The proxy `config.matcher` is unchanged from the pre-refactor middleware matcher. The fix lives in the `authorized` callback inside `auth.ts`.

### FR8 — Rename `middleware.ts` to `proxy.ts` (Next.js 16 convention)

- `git mv apps/web/middleware.ts apps/web/proxy.ts` to preserve file history.
- Rename the export from `auth as middleware` to `auth as proxy`.
- The matcher and config block are unchanged.

## Non-Functional Requirements

- All existing 90 web + 35 shared + 21 server = 146 tests continue to pass.
- New tests bring the total to ~150+ (3 new tests minimum).
- `npm run typecheck` clean across all 3 workspaces.
- `npm run lint` clean for `apps/web` and `apps/server`.
- No lockfile change.
- No URL change.

## Acceptance Criteria

- **AC1:** `apps/web/src/lib/dal.ts` exists, exports `verifySession`, marked `'server-only'`.
- **AC2:** The `authorized` callback in `apps/web/src/auth.ts` uses a positive `PROTECTED_PREFIXES` list. `PUBLIC_ROUTES` is removed.
- **AC3:** Manually verified: an unauthenticated GET to `/boards`, `/boards/new`, `/boards/[boardId]` all redirect to `/login` (via proxy/middleware).
- **AC4:** `apps/web/src/lib/actions/boards/auth.ts` is deleted.
- **AC5:** None of the 6 board Server Actions import `getSessionUserId`; all import `verifySession` from `@/lib/dal`.
- **AC6:** `apps/web/src/app/boards/new/page.tsx` is a server component (no `"use client"`) and calls `verifySession()`. The form lives in `components/boards/new-board-form.tsx` (`"use client"`).
- **AC7:** `apps/web/src/app/boards/page.tsx` and `[boardId]/page.tsx` no longer import `auth` from `@/auth` and no longer contain `redirect('/login')`. They call `verifySession()`.
- **AC8:** No file at `apps/web/middleware.ts` exists at end of track.
- **AC9:** `apps/web/src/__tests__/authorized-middleware.test.ts` exists and passes.
- **AC10:** `apps/web/src/lib/dal/__tests__/dal.test.ts` exists and passes.
- **AC11:** `npm test` passes across all 3 workspaces; `npm run typecheck` passes; `npm run lint` passes for `apps/web` and `apps/server`.
- **AC12:** Manual end-to-end verification: log in, create a board, view dashboard, open the board, delete + undo, all still work.
- **AC13:** `apps/web/proxy.ts` exports `auth as proxy` (not `auth as middleware`) and the `config.matcher` is byte-identical to the pre-refactor middleware matcher.

## Out of Scope

- Adding role-based access control (RBAC) for future user roles. `verifySession()` returns `{ userId }` only.
- Moving `/login` and `/register` into a `(public)` route group.
- Switching from JWT to database session strategy.
- Updating the login/register flow itself.
- Adopting a different auth library.
- Server Actions "fail-soft" mode (background sync, etc.) — current redirect-on-fail is fine for the existing call sites.
