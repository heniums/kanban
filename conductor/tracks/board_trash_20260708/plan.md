# Implementation Plan: Board Trash Management & Undo Fix

## Phase 1: Foundation & Undo Fix

- [ ] Task: Write unit tests for board restore (undo) Server Action
  - [ ] Test successful restore sets `deletedAt` to null
  - [ ] Test restore fails for non-existent or non-owned board
  - [ ] Test restore fails for unauthenticated user

- [ ] Task: Implement and fix board restore Server Action and undo toast
  - [ ] Investigate existing undo mechanism and identify failure point
  - [ ] Fix the restore Server Action logic
  - [ ] Wire restore action to the toast undo button with optimistic UI

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `fix(boards): Restore board deletion undo functionality`

- [ ] Task: Write tests for soft-delete board query filtering
  - [ ] Test active board queries exclude `deletedAt IS NOT NULL` boards
  - [ ] Test trash queries only include `deletedAt IS NOT NULL` boards for the owner

- [ ] Task: Update board queries for soft-delete separation
  - [ ] Update dashboard and `/boards` queries to filter out deleted boards
  - [ ] Add new trash-specific query for paginated, searched deleted boards

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(boards): Add soft-delete query separation for active and deleted boards`

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Undo Fix' (Protocol in workflow.md)

## Phase 2: Trash View UI

- [ ] Task: Write tests for `/trash` page rendering and access control
  - [ ] Test page renders for authenticated owner
  - [ ] Test page redirects unauthenticated users
  - [ ] Test page shows empty state when no deleted boards exist

- [ ] Task: Implement `/trash` page route and layout
  - [ ] Create `app/trash/page.tsx` with server-side data fetch
  - [ ] Add layout wrapper with navigation and title
  - [ ] Link `/trash` from dashboard (header or sidebar)

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Add dedicated trash page for deleted boards`

- [ ] Task: Write tests for DeletedBoardCard component
  - [ ] Test renders board title, description, deleted date
  - [ ] Test restore button triggers action
  - [ ] Test permanent delete button opens confirmation dialog

- [ ] Task: Implement DeletedBoardCard component
  - [ ] Build reusable `DeletedBoardCard` using shadcn/ui components
  - [ ] Add restore and permanent delete action triggers
  - [ ] Style with existing design system tokens

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Add DeletedBoardCard component with actions`

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Trash View UI' (Protocol in workflow.md)

## Phase 3: Pagination & Search

- [ ] Task: Write tests for paginated trash board queries
  - [ ] Test pagination returns exactly 10 items per page
  - [ ] Test page parameter correctly offsets results
  - [ ] Test total page count is accurate

- [ ] Task: Implement pagination logic in trash view
  - [ ] Update trash query to accept `limit` and `offset`
  - [ ] Add pagination controls to `/trash` page UI
  - [ ] Sync pagination state with URL query params (`?page=`)

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Add pagination to deleted boards view`

- [ ] Task: Write tests for title search in trash view
  - [ ] Test case-insensitive partial title match
  - [ ] Test search with no results shows empty state
  - [ ] Test search combined with pagination

- [ ] Task: Implement search by title
  - [ ] Add `ilike` or similar filter to trash query
  - [ ] Add search input to `/trash` page
  - [ ] Sync search state with URL query params (`?q=`)

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Add title search to deleted boards view`

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Pagination & Search' (Protocol in workflow.md)

## Phase 4: Restore & Permanent Delete

- [ ] Task: Write tests for restore board Server Action from trash view
  - [ ] Test successful restore from `/trash`
  - [ ] Test restore rehydrates board in active lists
  - [ ] Test authorization (owner only)

- [ ] Task: Implement restore action in trash view
  - [ ] Reuse or extend existing restore Server Action
  - [ ] Integrate with `DeletedBoardCard` restore button
  - [ ] Show toast confirmation after restore

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Enable board restore from trash view`

- [ ] Task: Write tests for permanent delete Server Action
  - [ ] Test cascade deletes board members, lists, cards, labels
  - [ ] Test Cloudinary attachments are deleted
  - [ ] Test authorization (owner only)
  - [ ] Test confirmation dialog prevents accidental deletion

- [ ] Task: Implement permanent delete with full cleanup
  - [ ] Query all card attachments for the board
  - [ ] Delete attachments from Cloudinary via existing utility
  - [ ] Cascade-delete related DB rows (members, lists, cards, labels)
  - [ ] Hard-delete the board row

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Implement permanent board deletion with Cloudinary cleanup`

- [ ] Task: Write tests for confirmation dialog
  - [ ] Test dialog opens on permanent delete click
  - [ ] Test cancel dismisses dialog without deleting
  - [ ] Test confirm proceeds with deletion

- [ ] Task: Implement confirmation dialog for permanent delete
  - [ ] Use shadcn/ui `AlertDialog` or similar
  - [ ] Clear warning copy: "Delete this board permanently? This action cannot be undone."
  - [ ] Integrate with `DeletedBoardCard`

- [ ] Task: Verify all tests pass and commit
  - [ ] Run `npm test`
  - [ ] Commit with `feat(trash): Add permanent delete confirmation dialog`

- [ ] Task: Conductor - User Manual Verification 'Phase 4: Restore & Permanent Delete' (Protocol in workflow.md)
