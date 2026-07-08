# Track Specification: Board Trash Management & Undo Fix

## Overview

Implement a comprehensive board trash management system. This includes fixing the non-functional undo toast on board deletion, adding a dedicated `/trash` page for board owners to view all their soft-deleted boards, and providing restore and permanent delete actions. The trash view must support pagination and search by title. Permanent deletion must cascade to remove all related database records and delete associated Cloudinary image attachments.

## Functional Requirements

### 1. Fix Board Deletion Undo

- The 5-second toast that appears after soft-deleting a board must correctly restore the board when "Undo" is clicked.
- Restore must set `deletedAt` back to null and preserve all board data, lists, cards, and labels.

### 2. Soft-Deleted Board Queries

- Update board list queries to properly filter by `deletedAt IS NOT NULL` for trash views.
- Ensure existing dashboard and `/boards` queries exclude soft-deleted boards (regression check).

### 3. Trash View (`/trash`)

- A dedicated page accessible from the dashboard (e.g., sidebar link or header menu).
- Display only boards where the current user is the owner and `deletedAt IS NOT NULL`.
- Empty state: "No deleted boards." with a link back to the dashboard.

### 4. Pagination

- Server-side pagination with 10 boards per page.
- URL query parameter support (`?page=2`).

### 5. Search

- Server-side search filtering soft-deleted boards by title (case-insensitive, partial match).
- URL query parameter support (`?q=keyword`).

### 6. Restore Action

- "Restore" button on each deleted board card in the trash view.
- Restore sets `deletedAt` to null.
- Toast confirmation: "Board restored."
- Redirect or refresh to show updated list.

### 7. Permanent Delete Action

- "Delete permanently" button on each deleted board card with a confirmation dialog.
- After confirmation:
  1. Delete all related card image attachments from Cloudinary.
  2. Delete all related database records: board members, lists, cards, labels.
  3. Finally, hard-delete the board row from the database.
- Toast confirmation: "Board permanently deleted."

### 8. Navigation & Access Control

- Only authenticated board owners can access `/trash` and perform restore/permanent delete actions.
- Redirect non-owners or unauthenticated users to the dashboard.

## Non-Functional Requirements

- Follow existing design system (Tailwind CSS v4 + shadcn/ui).
- WCAG 2.1 AA accessibility compliance.
- Responsive layout for desktop and tablet breakpoints.
- Maintain minimum 80% test coverage.
- Follow strict TDD workflow: write tests first, then implement.

## Acceptance Criteria

- [ ] Clicking "Undo" on the board deletion toast successfully restores the board within the 5-second window.
- [ ] Soft-deleted boards do not appear in the main dashboard or `/boards` lists.
- [ ] Board owner can navigate to `/trash` and see all their deleted boards.
- [ ] Trash view paginates at exactly 10 items per page.
- [ ] Search by title filters results correctly in the trash view (case-insensitive, partial match).
- [ ] Restore action moves the board back to the active boards list.
- [ ] Permanent delete action removes the board and all related data from the database and Cloudinary.
- [ ] Non-owners or unauthenticated users cannot access the `/trash` view.
- [ ] All changes pass lint, typecheck, and tests.

## Out of Scope

- Organization/team-level trash management (org hierarchy is post-MVP).
- Mobile-optimized trash view (mobile is out of MVP scope).
- Bulk restore or bulk permanent delete operations.
- Trash retention policies or automatic purge after N days.
- Audit log of delete/restore actions.
