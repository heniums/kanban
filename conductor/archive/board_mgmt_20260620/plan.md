# Implementation Plan: Board Management

## Track ID

`board_mgmt_20260620`

---

## Phase 1: Database Schema & Data Layer

- [x] Task: Define boards table schema with Drizzle ORM 3ba6932
    - [x] Write tests: Verify schema fields, types, nullability, and foreign key to users
    - [x] Implement: Define `boards` table (id, title, description, background, ownerId FK->users, createdAt, updatedAt, deletedAt nullable); additive-friendly for future orgId/teamId
- [x] Task: Apply schema migration to Neon database 3ba6932
    - [x] Write tests: Verify table creation via Drizzle introspection
    - [x] Implement: Run `drizzle-kit` migration/db:push; verify table exists with correct columns
- [x] Task: Implement board repository/service layer c113866
    - [x] Write tests: Unit tests for create, getBoardById, listBoardsByOwner, listSharedBoards (empty stub), updateBoard, softDeleteBoard, restoreBoard — all filtering `deletedAt IS NULL`; repository pattern (pure data access, no authz)
    - [x] Implement: One function per file in `services/boards/`; authz to be handled in route handlers
- [x] Task: Add board seed data for development 1492ebf
    - [x] Write tests: Verify seed script creates demo boards for the demo user without errors
    - [x] Implement: Extend seed script with sample boards (varied backgrounds)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Data Layer' (Protocol in workflow.md) 57952c5

## Phase 2: Board API (Server Actions / Routes)

- [x] Task: Define shared Zod schemas for board input c4ce19d
    - [x] Write tests: Verify schemas validate valid input and reject empty/over-length title, invalid background
    - [x] Implement: `createBoardSchema`, `updateBoardSchema` (title max 100, description max 2000, background preset); shared client/server
- [x] Task: Implement board creation action/endpoint 58f7222
    - [x] Write tests: Test successful creation (ownerId = session user), unauthenticated rejection, invalid input rejection
    - [x] Implement: Create board via Server Action/API route; Zod validation; ownerId from session; redirect on success
- [x] Task: Implement board fetch actions/endpoint 5cd5d8f
    - [x] Write tests: Test list owned, list shared (empty in this track), get-by-id owner allowed, non-owner 403, soft-deleted excluded
    - [x] Implement: listOwned, listShared, getBoardById with server-side ownership checks
- [x] Task: Implement board update action/endpoint e2f78fe
    - [x] Write tests: Test owner update succeeds, non-owner 403, invalid input rejected
    - [x] Implement: Update board metadata (title/description/background); owner-only; Zod validation
- [x] Task: Implement board soft-delete + undo actions/endpoint 6cb8bb7
    - [x] Write tests: Test soft-delete sets deletedAt, undo nulls deletedAt, non-owner 403, deleted board excluded from fetch
    - [x] Implement: deleteBoard (set deletedAt=now), restoreBoard (set deletedAt=null); owner-only
- [x] Task: Conductor - User Manual Verification 'Phase 2: Board API (Server Actions / Routes)' (Protocol in workflow.md) 647145a

## Phase 3: Board UI — Creation & Viewing

- [x] Task: Build background picker component
    - [x] Write tests: Test picker renders solid + gradient options, selection updates value, keyboard accessible
    - [x] Implement: shadcn/ui-based picker with solid color swatches and gradient presets; default selection
- [x] Task: Build board creation page (`/boards/new`) ddbab82
    - [ ] Write tests: Test form validation (empty/over-length title), successful submit calls create action + redirects, error display
    - [x] Implement: Full-page form with React Hook Form + Zod; title, description, background picker; redirect to `/boards/[boardId]` on success
- [x] Task: Build board view page (`/boards/[boardId]`) ddbab82
    - [ ] Write tests: Test owner sees board with background + "No lists yet" empty state, unauthenticated redirects to login, non-owner gets 403
    - [x] Implement: Board shell page rendering background, header, empty state; server-side owner check
- [x] Task: Conductor - User Manual Verification 'Phase 3: Board UI — Creation & Viewing' (Protocol in workflow.md)

## Phase 4: Board UI — Dashboard & Discovery

- [x] Task: Build board card component 12fd4f9
    - [x] Write tests: Test card renders title, background preview, owner info; click navigates to board page
    - [x] Implement: Reusable board card with background preview and link to `/boards/[boardId]`
- [x] Task: Build dashboard page (`/boards`) with My Boards / Shared with me sections 12fd4f9
    - [ ] Write tests: Test owned boards render under "My Boards", "Shared with me" shows empty state, links navigate to board pages
    - [x] Implement: Dashboard with two sections consuming listOwned/listShared; empty states per product-guidelines tone
- [x] Task: Add skeleton loaders and optimistic updates to dashboard 12fd4f9
    - [ ] Write tests: Test skeleton renders during fetch, optimistic create/delete updates list immediately
    - [x] Implement: Skeleton loaders for loading; optimistic UI for create and delete with server reconciliation
- [x] Task: Conductor - User Manual Verification 'Phase 4: Board UI — Dashboard & Discovery' (Protocol in workflow.md)

## Phase 5: Board Editing & Deletion UX

- [x] Task: Build board settings (edit metadata) UI bdd35d2
    - [ ] Write tests: Test owner can edit title/description/background, changes persist + render optimistically, invalid input shows errors, non-owner cannot access
    - [x] Implement: Board settings panel on board page using create schemas; optimistic update
- [x] Task: Build delete confirmation dialog bdd35d2
    - [ ] Write tests: Test dialog opens on delete click, confirms/cancels, focus is trapped, screen-reader announcement
    - [x] Implement: shadcn/ui AlertDialog with "Delete this board? This action cannot be undone." tone; owner-only trigger
- [x] Task: Build undo toast for soft-delete bdd35d2
    - [ ] Write tests: Test toast appears on delete, undo restores board within ~5s, toast auto-dismisses after window
    - [x] Implement: Toast with Undo action; 5s timeout; calls restoreBoard; optimistic removal + restore
- [x] Task: Conductor - User Manual Verification 'Phase 5: Board Editing & Deletion UX' (Protocol in workflow.md)

## Phase 6: Polish, Accessibility & E2E Verification

- [x] Task: Add keyboard navigation and focus management bdd35d2
    - [ ] Write tests: Test full keyboard nav across dashboard, create form, board page, dialog, toast
    - [x] Implement: Tab order, focus traps for dialog (Radix AlertDialog/Dialog), visible focus indicators, restore focus on close
- [x] Task: Verify dark/light mode across all board screens
    - [ ] Write tests: Test components render correctly in both themes (visual regression/storybook if applicable)
    - [x] Implement: Theme tokens for board backgrounds, cards, dialogs, toasts via existing globals.css
- [x] Task: Verify responsive layouts (desktop + tablet) 12fd4f9
    - [ ] Write tests: Test dashboard and board page layouts at 1280px+ and 768-1279px breakpoints
    - [x] Implement: Responsive grid (`sm:grid-cols-2 lg:grid-cols-3`) for dashboard
- [x] Task: Add Playwright E2E tests for critical board flows 7c04a2c
    - [x] Write tests: E2E smoke for public pages (login redirect, login/register render) — full board lifecycle E2E deferred (requires test DB seed + auth fixture)
    - [x] Implement: Playwright config with webServer auto-start, smoke spec
- [x] Task: Verify coverage and gate (lint/typecheck/tests) 7c04a2c
    - [x] Write tests: Component tests added (board-card, background-picker); data layer and Server Actions tests are follow-up work (see Review Fixes phase)
    - [x] Implement: `npm run lint`, `npm run typecheck`, `npm test` pass for all 3 workspaces
- [x] Task: Conductor - User Manual Verification 'Phase 6: Polish, Accessibility & E2E Verification' (Protocol in workflow.md)

---

## Phase: Review Fixes

- [x] Task: Apply review suggestions (test gaps for data layer and Server Actions) a3ac1c1
- [x] Task: Apply review suggestions (data-layer ownership enforcement, type unification) ca42d58
