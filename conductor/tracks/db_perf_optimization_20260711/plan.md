# Implementation Plan: Database & Data-Loading Performance Optimization

## Phase 1: Database Indexes (FR-1)

- [x] Task: Write tests verifying index declarations exist on key foreign-key columns
  - [x] Add a schema test that asserts `cards.boardId`, `comments.cardId`, `comments.userId`, `labels.boardId`, `checklists.cardId`, `checklistItems.checklistId`, `attachments.createdBy`, `boards.ownerId` have index declarations
  - [x] Add a schema test that asserts a partial index on `boards.deletedAt` (WHERE deleted_at IS NOT NULL) exists
- [x] Task: Add index declarations to Drizzle schema files
  - [x] Add `index()` on `cards.boardId` in `src/lib/db/schema/cards.ts`
  - [x] Add `index()` on `comments.cardId` and `comments.userId` in `src/lib/db/schema/comments.ts`
  - [x] Add `index()` on `labels.boardId` in `src/lib/db/schema/labels.ts`
  - [x] Add `index()` on `checklists.cardId` in `src/lib/db/schema/checklists.ts`
  - [x] Add `index()` on `checklistItems.checklistId` in `src/lib/db/schema/checklist-items.ts`
  - [x] Add `index()` on `attachments.createdBy` in `src/lib/db/schema/attachments.ts`
  - [x] Add `index()` on `boards.ownerId` and partial index on `boards.deletedAt` in `src/lib/db/schema/boards.ts`
- [x] Task: Generate and verify the Drizzle migration
  - [x] Run `npm run db:generate` to produce the new migration SQL
  - [x] Verify the generated SQL contains `CREATE INDEX` statements for all target columns
  - [x] Run `npm run db:push` to apply the migration
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test` to confirm schema tests pass
  - [x] Commit: `perf(db): add indexes for frequently queried foreign-key columns`
- [x] Task: Conductor - User Manual Verification 'Database Indexes (FR-1)' (Protocol in workflow.md)

## Phase 2: Consolidate Sequenced UPDATE Loops in Mutations (FR-2a)

- [x] Task: Write tests for `moveCard` batched position updates
  - [x] Write a test asserting `moveCard` within the same list issues a constant number of UPDATE statements regardless of list size (mock the tx and count calls)
  - [x] Write a test asserting `moveCard` across lists issues a constant number of UPDATE statements
  - [x] Write a test asserting the final card ordering matches the existing behavior (same positions as before refactor)
- [x] Task: Implement batched `UPDATE ... CASE` for `moveCard`
  - [x] Replace the six sequential-update loops (`mutations.ts:170-184, 219-251`) with at most two `UPDATE ... SET position = CASE WHEN id = ? THEN ? ... END WHERE id IN (...)` statements per list
  - [x] Preserve the temporary-negative-position strategy to avoid unique constraint violations
  - [x] Return the moved card row from the final batch UPDATE with `.returning()`
- [x] Task: Write tests for `reorderCards` batched updates
  - [x] Write a test asserting `reorderCards` issues a constant number of UPDATE statements regardless of list size
  - [x] Write a test asserting the final card ordering matches the provided `orderedCardIds`
- [x] Task: Implement batched `UPDATE ... CASE` for `reorderCards`
  - [x] Replace the two sequential-update loops (`mutations.ts:266-283`) with two batched `UPDATE ... CASE` statements
  - [x] Preserve the deleted-board guard subquery in the WHERE clause
- [x] Task: Write tests for `reorderLists` batched updates
  - [x] Write a test asserting `reorderLists` issues a constant number of UPDATE statements regardless of list count
  - [x] Write a test asserting the final list ordering matches the provided `orderedListIds`
- [x] Task: Implement batched `UPDATE ... CASE` for `reorderLists`
  - [x] Replace the two sequential-update loops (`lists/reorder.ts:16-33`) with two batched `UPDATE ... CASE` statements
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test` to confirm mutation tests pass
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(data): consolidate sequential UPDATE loops in moveCard/reorderCards/reorderLists`
- [x] Task: Conductor - User Manual Verification 'Consolidate Sequenced UPDATE Loops in Mutations (FR-2a)' (Protocol in workflow.md)

## Phase 3: Batch Inserts & deleteList N+1 Fix (FR-2b)

- [x] Task: Write tests for batched label/assignee inserts in `createCard` and `updateCard`
  - [x] Write a test asserting `createCard` inserts all labels in a single `insert().values([...])` call (not a loop)
  - [x] Write a test asserting `createCard` inserts all assignees in a single batch insert
  - [x] Write a test asserting `updateCard` re-inserts labels/assignees in a single batch each
- [x] Task: Implement batched inserts in `createCard` and `updateCard`
  - [x] Replace the `for` loop at `mutations.ts:42-46` with a single `tx.insert(cardLabels).values([...])`
  - [x] Replace the `for` loop at `mutations.ts:47-51` with a single `tx.insert(cardAssignees).values([...])`
  - [x] Replace the `for` loop at `mutations.ts:79-82` with a single batch insert
  - [x] Replace the `for` loop at `mutations.ts:84-87` with a single batch insert
- [x] Task: Write tests for `copyCard` batched label/assignee inserts
  - [x] Write a test asserting `copyCard` inserts copied labels in a single batch insert
  - [x] Write a test asserting `copyCard` inserts copied assignees in a single batch insert
- [x] Task: Implement batched inserts in `copyCard`
  - [x] Replace the `for` loop at `mutations.ts:320-322` with a single batch insert
  - [x] Replace the `for` loop at `mutations.ts:328-330` with a single batch insert
- [x] Task: Write tests for `deleteList` N+1 fix
  - [x] Write a test asserting `deleteList` fetches all attachments for the list in a single query (not per-card)
  - [x] Write a test asserting Cloudinary deletions are parallelized with `Promise.allSettled`
- [x] Task: Implement `deleteList` N+1 fix
  - [x] Add a query to fetch all attachments for all cards in the list in a single JOIN query
  - [x] Replace the sequential `for` loop of `listAttachmentsByCardId` calls (`lists/delete.ts:17-26`) with the single query
  - [x] Replace the sequential Cloudinary `deleteCloudinaryAsset` calls with `Promise.allSettled`
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(data): batch label/assignee inserts and fix deleteList N+1`
- [x] Task: Conductor - User Manual Verification 'Batch Inserts & deleteList N+1 Fix (FR-2b)' (Protocol in workflow.md)

## Phase 4: Eliminate Redundant Post-Mutation Fetches (FR-3)

- [x] Task: Write tests for `updateCardAction` realtime payload without redundant fetch
  - [x] Write a test asserting `updateCardAction` does NOT call `getCardSummaryById` after update
  - [x] Write a test asserting the realtime `CardSummary` payload is built from the returned card row and the provided label/assignee arrays
- [x] Task: Implement redundant-fetch removal in `updateCardAction`
  - [x] Get label IDs and assignee IDs from the `updateCard` input/return (the labels were provided in `data.labelIds` and assignees in `data.assigneeIds`)
  - [x] Build the `CardSummary` object from the updated card row + those arrays instead of calling `getCardSummaryById` (`actions/cards/index.ts:75`)
- [x] Task: Write tests for checklist action `boardId` return and bug fix
  - [x] Write a test asserting `createChecklistItemAction` does not perform a post-mutation `SELECT boardId` lookup
  - [x] Write a test asserting the mutation returns `boardId` so the action can use it directly
  - [x] Write a test asserting the realtime event emits correct `cardId` (not `boardId`) — verifies the bug fix
- [x] Task: Implement `boardId` return in checklist mutations and actions
  - [x] Update checklist mutation functions to return `boardId` from the transaction (JOIN `checklists -> cards` to get `boardId`)
  - [x] Remove the inline `SELECT boardId` lookups in `actions/checklists/index.ts:117-121,152-157,187-191`
  - [x] Fix the `cardId: row.boardId` bug to emit the correct `cardId`
- [x] Task: Write tests for comment action `boardId` return
  - [x] Write a test asserting `createComment`/`updateComment`/`deleteComment` mutations return `boardId`
  - [x] Write a test asserting the comment actions do not perform a post-mutation `SELECT boardId` lookup
- [x] Task: Implement `boardId` return in comment mutations and actions
  - [x] Update comment mutation functions to return `boardId` (JOIN `cards` to get `boardId`)
  - [x] Remove the redundant lookups in `actions/comments/index.ts:77,103`
- [x] Task: Write test for `removeMember` single fetch
  - [x] Write a test asserting `removeMember` performs exactly one member fetch (inside the transaction)
- [x] Task: Implement single-fetch `removeMember`
  - [x] Remove the pre-transaction member fetch at `members/remove.ts:8-16`
  - [x] Reuse the in-transaction fetch at `members/remove.ts:20-23`
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(actions): eliminate redundant post-mutation fetches and fix checklist cardId bug`
- [x] Task: Conductor - User Manual Verification 'Eliminate Redundant Post-Mutation Fetches (FR-3)' (Protocol in workflow.md)

## Phase 5: NextAuth jwt Callback Optimization (FR-4)

- [x] Task: Write tests for `jwt` callback without per-request DB query
  - [x] Write a test asserting the `jwt` callback does NOT call `getUserById` on every token resolution when the token already contains `avatarUrl`
  - [x] Write a test asserting `avatarUrl` IS refreshed when the `update` trigger fires (profile update)
  - [x] Write a test asserting a new login (no `avatarUrl` in token) fetches the user to populate it
- [x] Task: Implement `jwt` callback optimization in `auth.ts`
  - [x] Cache `avatarUrl` in the JWT token on first login / when missing
  - [x] Only call `getUserById` when the token lacks `avatarUrl` or when the `update` trigger fires
  - [x] Preserve session correctness: authenticated users see their current avatar after login and after updating their avatar
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(auth): stop running getUserById on every jwt callback invocation`
- [x] Task: Conductor - User Manual Verification 'NextAuth jwt Callback Optimization (FR-4)' (Protocol in workflow.md)

## Phase 6: Connection Pool Configuration & Query Instrumentation (FR-5)

- [x] Task: Write tests for connection pool configuration
  - [x] Write a test asserting the pool is created with `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, and `statement_timeout` values
  - [x] Write a test asserting slow-query logging activates for queries above the threshold
- [x] Task: Implement pool configuration in `client.ts`
  - [x] Set `max` to an appropriate value for Neon (e.g. 10-15)
  - [x] Set `idleTimeoutMillis` and `connectionTimeoutMillis`
  - [x] Set `statement_timeout` via pool config or connection initialization
  - [x] Add lightweight query timing instrumentation (wrap the Drizzle instance or pool to log queries slower than a configurable threshold)
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(db): configure connection pool and add slow-query instrumentation`
- [x] Task: Conductor - User Manual Verification 'Connection Pool Configuration & Query Instrumentation (FR-5)' (Protocol in workflow.md)

## Phase 7: Board Page Query Parallelization & Over-Fetch Fix (FR-6, FR-7)

- [x] Task: Write tests for `getCardsByBoardId` column selection
  - [x] Write a test asserting `getCardsByBoardId` selects only `id, listId, boardId, title, position, dueDate` — not `description`
- [x] Task: Implement narrow column selection in `getCardsByBoardId`
  - [x] Replace the `select()` (all columns) at `queries.ts:75-83` with an explicit column set excluding `description`
  - [x] Update the return type to reflect the narrower shape
  - [x] Verify the board view consumer (`card-item`) does not access `description`
- [x] Task: Write test for board page query parallelization
  - [x] Write a test asserting `getBoardCapabilities` and `getListsByBoardId` are invoked in parallel with (or immediately after) `getBoardById`, not sequentially
- [x] Task: Implement board page query parallelization
  - [x] Refactor `src/app/boards/[boardId]/page.tsx` to batch `getBoardById` + `getBoardCapabilities` + `getListsByBoardId` + the 6-query batch into minimize sequential round trips
  - [x] Preserve `notFound()` behavior — `getBoardById` must still resolve first to trigger 404
- [x] Task: Verify all tests pass and commit
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Commit: `perf(data): parallelize board page queries and narrow card column selection`
- [x] Task: Conductor - User Manual Verification 'Board Page Query Parallelization & Over-Fetch Fix (FR-6, FR-7)' (Protocol in workflow.md)

## Phase 8: Final Verification & Cleanup

- [x] Task: Run full test suite and type/lint checks
  - [x] Run `npm test`
  - [x] Run `npm run typecheck`
  - [x] Run `npm run lint`
  - [x] Fix any failing tests or lint/type errors introduced by the refactors
- [x] Task: Run migration and verify no further migration diff
  - [x] Run `npm run db:generate` and confirm no uncommitted migration diff remains
- [x] Task: Manual verification of all flows
  - [x] Verify board page loads faster (board with multiple lists and cards)
  - [x] Verify dashboard page loads faster
  - [x] Verify trash page loads faster
  - [x] Verify card open / interaction is responsive
  - [x] Verify drag-and-drop still works correctly (move, reorder)
  - [x] Verify avatar displays correctly after login and after updating avatar
  - [x] Verify slow-query logging appears in console for slow operations
- [x] Task: Conductor - User Manual Verification 'Final Verification & Cleanup' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions ffc2961
