# Specification: Board Management

## Track ID

`board_mgmt_20260620`

## Overview

This track delivers the foundational **board** entity for the Kanban Collaboration Platform — the container that lists, cards, and real-time collaboration will build on in subsequent tracks. It covers creating, viewing, discovering, editing, and safely deleting boards, with each board owned by its creator. This is the next MVP item after User Authentication (completed in the `scaffold_auth` track).

Per `product.md`, the MVP board scope is "Create, open, delete; each board owned by its creator." This track adds lightweight board-metadata editing and a recoverable soft-delete (with undo), consistent with the product's "zero data loss" principle, without pulling the full post-MVP archive feature into MVP.

## Context & Constraints

- **Tech stack:** Next.js 16 (App Router) + Express/Socket.io, PostgreSQL 16 (Neon), Drizzle ORM, NextAuth v5, Tailwind v4 + shadcn/ui, Zod, React Hook Form, Vitest + Playwright.
- **Auth:** Relies on the existing NextAuth session from the `scaffold_auth` track. All board operations require an authenticated session.
- **Real-time is OUT of this track** — board CRUD uses HTTP (Server Actions / API routes) only. Socket.io integration is a separate track.
- **Forward-compatible schema:** The `boards` table is designed for additive migrations (e.g., nullable `orgId`/`teamId` added later) per `product.md`.
- **Design/UX:** Follows `product-guidelines.md` — dark-mode-first, optimistic UI, skeleton loaders, WCAG 2.1 AA, responsive desktop + tablet, board backgrounds (solid/gradient), consistent shadcn/ui components.

## Functional Requirements

### FR1 — Board Data Model
- A `boards` table stores: `id`, `title` (required), `description` (nullable), `background` (solid color or gradient config), `ownerId` (FK -> users), `createdAt`, `updatedAt`, `deletedAt` (nullable, for soft delete).
- Schema is additive-friendly for future `orgId`/`teamId`/visibility columns.

### FR2 — Board Creation
- Authenticated users create a board via a full-page form at `/boards/new`.
- Fields: `title` (required, max 100 chars), `description` (optional, max 2000 chars), `background` (picker: solid color or gradient; defaults to a sensible preset).
- The creator becomes the `ownerId`.
- Inputs validated with Zod (shared client/server schema).
- On success: redirect to the new board's page (`/boards/[boardId]`).
- Invalid input shows inline validation errors; no submission on error.

### FR3 — Board Viewing
- Each board has a page at `/boards/[boardId]` rendering the board shell with its chosen background.
- The board shell is the future home of lists/cards/real-time; this track renders background + header + empty state ("No lists yet").
- Only the owner can view a board in this track (sharing/members come later).
- Unauthenticated users are redirected to login; non-owners get a 403.

### FR4 — Board Discovery (Dashboard)
- A dashboard at `/boards` lists the user's boards, split into two sections:
  - **My Boards** — boards where `ownerId` = current user.
  - **Shared with me** — boards where the user is a member (empty state in this track; populated by the future sharing track).
- Board cards show title, background preview, and owner info; clicking navigates to the board page.
- Empty states follow `product-guidelines.md` tone ("No boards yet. Create one to get started.").
- Skeleton loaders during fetch; optimistic updates on create/delete.

### FR5 — Board Editing
- The owner can edit board metadata (title, description, background) from the board page settings.
- Same Zod validation as creation.
- Optimistic UI update with server reconciliation.

### FR6 — Board Deletion (Soft-Delete + Undo)
- Owner-only delete action, triggered from the dashboard card or board settings.
- Confirmation dialog: "Delete this board? This action cannot be undone." (per `product-guidelines.md` tone).
- On confirm: `deletedAt` is set to now() (soft delete); board is optimistically removed from the dashboard.
- An "Undo" toast is shown for ~5 seconds; clicking undo nulls `deletedAt` and restores the board.
- After the undo window, the board is excluded from all queries (`WHERE "deletedAt" IS NULL`).
- No dedicated "Archived boards" view or restore page in this track (full archive feature is post-MVP).

### FR7 — Authorization & Ownership
- Every board operation enforces ownership: only the `ownerId` user can view (in MVP), edit, or delete a board.
- All operations require an authenticated NextAuth session.
- Authorization checks happen on the server (never trust client state).

## Non-Functional Requirements

- **Performance:** Dashboard loads with up to 100 boards in <1s; board page loads in <1s.
- **Accessibility (WCAG 2.1 AA):** Full keyboard navigation, visible focus indicators, screen-reader announcements for delete confirmation and undo, dialogs trap focus.
- **Responsive:** Works on desktop (1280px+) and tablet (768-1279px); mobile is out of MVP.
- **Theming:** Dark-mode-first with light-mode toggle; all screens tested in both.
- **Security:** Zod validation on all inputs; server-side ownership checks on every operation; no leaking of other users' boards.
- **Optimistic UI:** Create, edit, and delete render instantly with server reconciliation and undo.
- **Code quality:** Lint, typecheck, and tests pass; >=80% coverage on board modules; follows `typescript-react-express.md` style guide.

## Acceptance Criteria

- **AC1:** An authenticated user can create a board at `/boards/new` with a required title; the board persists with `ownerId` = creator and the user is redirected to `/boards/[boardId]`.
- **AC2:** Creating a board with an empty or over-length title is rejected with inline validation errors; no board is created.
- **AC3:** The `/boards` dashboard renders "My Boards" and "Shared with me" sections; the user's owned boards appear under "My Boards" as cards linking to their board pages; "Shared with me" shows its empty state.
- **AC4:** The board page renders with the selected background and an empty "No lists yet" state; unauthenticated users are redirected to login and non-owners receive a 403.
- **AC5:** The owner can soft-delete a board via the confirmation dialog; the board is removed from the dashboard and an "Undo" toast is shown; undo within ~5s restores the board.
- **AC6:** Boards past the undo window (soft-deleted) do not appear in the dashboard or board queries.
- **AC7:** Only the owner can edit or delete a board; non-owner authenticated users receive 403 on edit/delete attempts.
- **AC8:** The owner can edit board metadata (title/description/background); changes persist and render optimistically with validation on invalid input.
- **AC9:** All flows are keyboard accessible, work in dark and light mode, and render correctly on desktop and tablet viewports.
- **AC10:** `npm run lint`, `npm run typecheck`, and `npm test` pass; board modules have >=80% test coverage.

## Out of Scope

- Lists, cards, and drag-and-drop (separate track).
- Real-time collaboration / Socket.io sync (separate track).
- Board sharing, member invites, and role tiers (separate track) — the "Shared with me" dashboard section exists but is empty.
- Full archive feature: archived-boards view, restore page, archive/unarchive toggle (post-MVP).
- Board favorites and recent-boards list (post-MVP).
- Organization/team assignment and public/private board visibility (post-MVP).
- Email notifications for mentions/assignments (post-MVP).
- Mobile native app and offline mode (out of MVP).
