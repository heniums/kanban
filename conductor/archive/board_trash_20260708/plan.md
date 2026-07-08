# Implementation Plan: Board Trash Management & Undo Fix

## Phase 1: Foundation & Undo Fix

- [x] Task: Write unit tests for board restore (undo) Server Action 27d3bc4
  - [x] Test successful restore sets `deletedAt` to null
  - [x] Test restore fails for non-existent or non-owned board
  - [x] Test restore fails for unauthenticated user

- [x] Task: Implement and fix board restore Server Action and undo toast 27d3bc4
  - [x] Investigate existing undo mechanism and identify failure point
  - [x] Fix the restore Server Action logic
  - [x] Wire restore action to the toast undo button with optimistic UI

- [x] Task: Verify all tests pass and commit 27d3bc4
  - [x] Run `npm test`
  - [x] Commit with `fix(boards): Restore board deletion undo functionality`

- [x] Task: Write tests for soft-delete board query filtering cee8a1c
  - [x] Test active board queries exclude `deletedAt IS NOT NULL` boards
  - [x] Test trash queries only include `deletedAt IS NOT NULL` boards for the owner

- [x] Task: Update board queries for soft-delete separation cee8a1c
  - [x] Update dashboard and `/boards` queries to filter out deleted boards
  - [x] Add new trash-specific query for paginated, searched deleted boards

- [x] Task: Verify all tests pass and commit cee8a1c
  - [x] Run `npm test`
  - [x] Commit with `feat(boards): Add soft-delete query separation for active and deleted boards`

- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Undo Fix' (Protocol in workflow.md) cee8a1c

## Phase 2: Trash View UI

- [x] Task: Write tests for `/trash` page rendering and access control d25294c
  - [x] Test page renders for authenticated owner
  - [x] Test page redirects unauthenticated users
  - [x] Test page shows empty state when no deleted boards exist

- [x] Task: Implement `/trash` page route and layout d25294c
  - [x] Create `app/trash/page.tsx` with server-side data fetch
  - [x] Add layout wrapper with navigation and title
  - [x] Link `/trash` from dashboard (header or sidebar)

- [x] Task: Verify all tests pass and commit d25294c
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Add dedicated trash page for deleted boards`

- [x] Task: Write tests for DeletedBoardCard component d25294c
  - [x] Test renders board title, description, deleted date
  - [x] Test restore button triggers action
  - [x] Test permanent delete button opens confirmation dialog

- [x] Task: Implement DeletedBoardCard component d25294c
  - [x] Build reusable `DeletedBoardCard` using shadcn/ui components
  - [x] Add restore and permanent delete action triggers
  - [x] Style with existing design system tokens

- [x] Task: Verify all tests pass and commit d25294c
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Add DeletedBoardCard component with actions`

- [x] Task: Conductor - User Manual Verification 'Phase 2: Trash View UI' (Protocol in workflow.md) d25294c

## Phase 3: Pagination & Search

- [x] Task: Write tests for paginated trash board queries 76ee6ff
  - [x] Test pagination returns exactly 10 items per page
  - [x] Test page parameter correctly offsets results
  - [x] Test total page count is accurate

- [x] Task: Implement pagination logic in trash view 76ee6ff
  - [x] Update trash query to accept `limit` and `offset`
  - [x] Add pagination controls to `/trash` page UI
  - [x] Sync pagination state with URL query params (`?page=`)

- [x] Task: Verify all tests pass and commit 76ee6ff
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Add pagination to deleted boards view`

- [x] Task: Write tests for title search in trash view 76ee6ff
  - [x] Test case-insensitive partial title match
  - [x] Test search with no results shows empty state
  - [x] Test search combined with pagination

- [x] Task: Implement search by title 76ee6ff
  - [x] Add `ilike` or similar filter to trash query
  - [x] Add search input to `/trash` page
  - [x] Sync search state with URL query params (`?q=`)

- [x] Task: Verify all tests pass and commit 76ee6ff
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Add title search to deleted boards view`

- [x] Task: Conductor - User Manual Verification 'Phase 3: Pagination & Search' (Protocol in workflow.md) 76ee6ff

## Phase 4: Restore & Permanent Delete

- [x] Task: Write tests for restore board Server Action from trash view 72dbc58
  - [x] Test successful restore from `/trash`
  - [x] Test restore rehydrates board in active lists
  - [x] Test authorization (owner only)

- [x] Task: Implement restore action in trash view 72dbc58
  - [x] Reuse or extend existing restore Server Action
  - [x] Integrate with `DeletedBoardCard` restore button
  - [x] Show toast confirmation after restore

- [x] Task: Verify all tests pass and commit 72dbc58
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Enable board restore from trash view`

- [x] Task: Write tests for permanent delete Server Action 72dbc58
  - [x] Test cascade deletes board members, lists, cards, labels
  - [x] Test Cloudinary attachments are deleted
  - [x] Test authorization (owner only)
  - [x] Test confirmation dialog prevents accidental deletion

- [x] Task: Implement permanent delete with full cleanup 72dbc58
  - [x] Query all card attachments for the board
  - [x] Delete attachments from Cloudinary via existing utility
  - [x] Cascade-delete related DB rows (members, lists, cards, labels)
  - [x] Hard-delete the board row

- [x] Task: Verify all tests pass and commit 72dbc58
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Implement permanent board deletion with Cloudinary cleanup`

- [x] Task: Write tests for confirmation dialog 72dbc58
  - [x] Test dialog opens on permanent delete click
  - [x] Test cancel dismisses dialog without deleting
  - [x] Test confirm proceeds with deletion

- [x] Task: Implement confirmation dialog for permanent delete 72dbc58
  - [x] Use shadcn/ui `AlertDialog` or similar
  - [x] Clear warning copy: "Delete this board permanently? This action cannot be undone."
  - [x] Integrate with `DeletedBoardCard`

- [x] Task: Verify all tests pass and commit 72dbc58
  - [x] Run `npm test`
  - [x] Commit with `feat(trash): Add permanent delete confirmation dialog`

- [x] Task: Conductor - User Manual Verification 'Phase 4: Restore & Permanent Delete' (Protocol in workflow.md) 72dbc58

## Phase: Review Fixes

- [x] Task: Apply review suggestions 8d34eb2
  - [x] Fix silent Cloudinary deletion error swallowing in permanent delete action
  - [x] Add debounce timeout cleanup on unmount in trash search input
  - [x] Mark all plan tasks as complete with commit SHAs
