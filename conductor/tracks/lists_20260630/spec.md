# Specification: Board Lists Management

## Overview

Implement full list management within a kanban board. A board contains one or more ordered lists (columns). Users can create, rename, delete, and reorder lists via drag-and-drop. New boards automatically receive a default "To Do" list so users can immediately start organizing work. Each list displays basic card placeholders to make the board view realistic and end-to-end testable.

This track delivers the foundational list container layer that the subsequent cards track will build upon.

## Functional Requirements

### 1. Data Model

- **lists** table:
  - `id`: UUID primary key (default random)
  - `boardId`: UUID, not null, foreign key → `boards.id`, cascade delete
  - `title`: text, not null, max 100 characters
  - `position`: integer, not null, defines list order within the board
  - `createdAt`: timestamp, default now, not null
  - `updatedAt`: timestamp, default now, auto-update on mutation, not null
- Unique constraint on (`boardId`, `position`) to prevent duplicate ordering
- Soft-delete is **not** required for lists in MVP (hard delete on list removal)

### 2. Board Creation Side Effect

- When a board is created via the existing `createBoard` action, automatically create a default list titled **"To Do"** with `position = 0`
- This default list is created in the same database transaction as the board itself (atomic)

### 3. List CRUD Operations (Server Actions)

All operations must verify the requesting user owns the parent board (owner-scoped).

- **createList**
  - Input: `boardId`, `title`
  - `position` is automatically assigned as `max(existing positions) + 1`
  - Returns the created list

- **renameList**
  - Input: `listId`, `newTitle`
  - Updates the list title in place
  - Returns the updated list

- **deleteList**
  - Input: `listId`
  - Hard-deletes the list and recompacts the positions of remaining lists on the same board (close gaps)
  - Returns success/failure

- **reorderLists**
  - Input: `boardId`, ordered array of `listId`s representing the new sequence
  - Bulk-updates positions to match the provided order
  - Returns the reordered lists

### 4. Query Operations

- **getListsByBoardId**
  - Input: `boardId`, owner-scoped
  - Returns all lists for a board ordered by `position` ascending
  - Includes basic card placeholders (empty arrays) so the shape matches the future cards track

### 5. Board Detail Page UI (`/boards/[boardId]`)

- Replace the current "No lists yet" empty state with a horizontal scrollable list container
- Each list renders as a vertical column with:
  - Header showing the list title
  - Inline rename: click title → inline editable input (blur or Enter to save, Escape to cancel)
  - Delete button (with confirmation) in the list header
  - A placeholder area at the bottom: "Cards will appear here" (visual placeholder for the cards track)
- An "Add list" button at the end of the horizontal container:
  - Click → inline input field to type list name
  - Enter or blur → creates list
  - Escape → cancels

### 6. Drag-and-Drop Reordering

- Use `@dnd-kit/core` and `@dnd-kit/sortable` (already in tech stack / to be installed)
- Horizontal drag-and-drop of entire list columns
- Optimistic UI update: reorder visually immediately, then call `reorderLists` Server Action
- On error: revert to original order
- Keyboard accessible: arrow keys to move focus, Space to lift, arrow keys to move, Space to drop

### 7. Validation

- `title`: required, 1–100 characters (Zod schema)
- All Server Actions validate inputs with Zod before database operations

## Non-Functional Requirements

- **Performance**: List operations must complete in < 200ms for boards with ≤ 50 lists
- **Accessibility**: All list actions are keyboard-navigable; dnd-kit provides screen-reader announcements
- **Responsive**: Horizontal scroll on mobile; lists have a minimum width of 280px

## Acceptance Criteria

- [ ] Creating a board automatically creates a "To Do" list visible on the board page
- [ ] An authenticated board owner can create additional lists
- [ ] Lists display in the correct order based on `position`
- [ ] Lists can be renamed inline
- [ ] Lists can be deleted with confirmation; remaining lists recompact positions
- [ ] Lists can be reordered via drag-and-drop with optimistic UI
- [ ] All CRUD operations are protected by board ownership checks
- [ ] Unit tests cover all data layer functions (≥ 80% coverage)
- [ ] Integration tests cover all Server Actions
- [ ] E2E tests cover create, rename, delete, and reorder flows
- [ ] All tests, lint, and typecheck pass

## Out of Scope

- Cards (create, edit, move, delete) — deferred to the next track
- Real-time collaboration for list changes
- List color coding or visual customizations
- Soft-delete / archive for lists
- WIP limits
- Copy / duplicate list
- Board sharing / multi-user access (MVP uses owner-only)
