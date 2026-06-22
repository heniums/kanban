# Specification: Board Polish & A11y

## Track ID

`board_polish_20260622`

## Overview

This track addresses the Low-severity issues identified in the review of the `board_mgmt_20260620` track. The work is purely UX hardening and accessibility polish — no new features, no architectural changes. The goal is to make the board CRUD flows (create, edit, delete with undo) production-quality from a usability and a11y perspective.

The `board_mgmt_20260620` track shipped with working functionality and 91 passing tests, but a strict code review flagged 6 Low-severity gaps. None of them are bugs, but each is a real footgun: form state that's not React-Compiler-friendly, screen readers that don't announce errors, a silent failure if undo's restore call throws, an alert dialog that can't reflect errors, a race condition on rapid double-clicks, and text that's invisible on light backgrounds.

## Context & Constraints

- **Scope:** The `apps/web` workspace only. No changes to `apps/server` or `@kanban/shared`.
- **Tech stack:** React 19 + Next.js 16, React Hook Form, shadcn/ui (Radix primitives), sonner toast. No new dependencies.
- **Existing tests:** 37 web tests must continue to pass; new tests should target the specific gaps below.
- **Style guide:** `conductor/code_styleguides/typescript-react-express.md` — kebab-case files, PascalCase components, explicit return types.
- **No new dependencies** — solve the RHF / React Compiler issue without downgrading or adding libraries.

## Functional Requirements

### FR1 — React Compiler Compatibility for Forms

The current code in `apps/web/src/app/boards/new/page.tsx:44` and `apps/web/src/components/boards/board-settings.tsx:40` calls `watch("background")` to keep the `BackgroundPicker` swatch in sync with form state. React 19's Compiler warns about this (lint: "Compilation Skipped: Use of incompatible library") because `watch()` returns a live-updating function that can't be safely memoized.

**Acceptance:**
- Both `new/page.tsx` and `board-settings.tsx` no longer use `watch()`.
- The `BackgroundPicker` swatch stays in sync with form state.
- The React Compiler lint warning for these files is gone.
- Lint: 0 errors, 0 warnings (down from 2 warnings) for these files specifically.

**Approach:** Use `Controller` from `react-hook-form` to bridge the picker into the form. `Controller` gives a stable `field.value` and `field.onChange` that the Compiler can memoize.

### FR2 — Form Input Accessibility

Screen readers don't announce validation errors associated with inputs because the error `<p>` tags aren't linked to the inputs via `aria-describedby`, and inputs don't have `aria-invalid` when they're in an error state.

**Acceptance:**
- Every form input in `new/page.tsx` and `board-settings.tsx` that has a corresponding error message:
  - Has `aria-invalid={!!errors.fieldName}` set
  - Has `aria-describedby` pointing to the error message's id
- The error `<p>` tags have matching `id` attributes
- A test asserts the aria attributes are present when errors exist

### FR3 — Undo Toast Error Handling

In `apps/web/src/components/boards/board-actions.tsx:46-53`, the undo toast's `onClick` calls `restoreBoardAction(board.id)`. If the restore fails (e.g., the board was hard-deleted, network error, or the action throws), the user clicks "Undo" and gets silent failure — the toast just disappears.

**Acceptance:**
- The `onClick` is wrapped in try/catch.
- On failure, a sonner `toast.error` is shown with a message like "Failed to restore board."
- On success, the existing success toast is shown.
- A test covers the failure path: mock `restoreBoardAction` to throw, click Undo, assert the error toast appears.

### FR4 — AlertDialog State Binding

In `apps/web/src/components/boards/board-actions.tsx:76-95`, the delete `AlertDialog` is uncontrolled (no `open` prop). If the delete fails server-side, the dialog stays open with no error feedback. The user has no way to know what happened.

**Acceptance:**
- The `AlertDialog` has its `open` state bound to a `useState` boolean.
- On `handleDelete` success, the dialog closes (`setOpen(false)` is called after the transition completes).
- On failure, the dialog stays open and shows a sonner `toast.error`.
- The delete confirmation tone matches `product-guidelines.md`: "Delete this board? This action cannot be undone." (already correct).

### FR5 — Race Condition Protection

The `AlertDialogAction`'s `disabled={isPending}` only prevents the click while the transition is in-flight. If the user double-clicks very fast (before the transition starts), both clicks could fire and trigger two delete operations.

**Acceptance:**
- A `useState` boolean `inFlight` short-circuits re-entry at the start of `handleDelete`.
- The check returns early if `inFlight` is already true.
- A test simulates a double-click and asserts the action is called only once.

### FR6 — Text Color on Light Backgrounds

The board page (`apps/web/src/app/boards/[boardId]/page.tsx:51-67`) uses hardcoded `text-white` for the board title, description, and the empty state. If a user creates a board with a light background (e.g., a custom `#ffffff` hex value that bypasses the `BackgroundPicker`'s restriction to dark/medium colors), the white text on white background is unreadable.

The `BackgroundPicker` constrains the user to dark/medium backgrounds today, but the `boardBackgroundSchema` in `@kanban/shared` accepts any valid hex/gradient, so a programmatic insert (seed script, future API) could store a light value.

**Acceptance:**
- A utility computes appropriate text color (white or near-black) based on background luminance.
- The board page uses the computed color instead of hardcoded `text-white`.
- A test covers at least one light background and one dark background, verifying the computed color.
- No regression: existing dark-background boards (e.g., `#1a1a2e`) still use white text.

## Non-Functional Requirements

- **All 91 existing tests pass.**
- **Typecheck passes for all 3 workspaces.**
- **Lint: 0 errors, 0 new warnings** (existing RHF warnings are resolved as part of FR1).
- **Style guide compliance:** kebab-case files, explicit return types on exported functions, no `any` outside test files.

## Acceptance Criteria

- **AC1:** Running `npm run lint --workspace apps/web` reports 0 errors and 0 warnings.
- **AC2:** Running `npm test` reports ≥ 95 tests passing (current 91 + new tests for the 6 issues).
- **AC3:** Running `npm run typecheck` reports no errors.
- **AC4:** Manual visual check: a board with a light background (e.g., `#f5f5f5`) renders the title and description in a readable dark color; a board with a dark background (e.g., `#1a1a2e`) renders text in white.
- **AC5:** Manual a11y check: with a screen reader or browser devtools a11y inspector, triggering a form error announces the error message and the input is marked `aria-invalid`.
- **AC6:** Manual click test: clicking Delete → confirming in the AlertDialog → seeing the toast → clicking Undo while the restore is in-flight only triggers one restore.

## Out of Scope

- Adding new features (e.g., confirmation prompts on discard, autosave for settings, etc.)
- Performance optimizations (memoization beyond React Compiler fixes, virtualizing the dashboard, etc.)
- Visual regression testing setup (Chromatic, Percy, etc.)
- Server-side changes (no new APIs, no schema changes)
- Internationalization (copy stays in English)
- Mobile-specific UX (already out of MVP scope per `product.md`)
