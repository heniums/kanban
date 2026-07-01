# Implementation Plan: Board Lists Management

## Phase 1: Database Schema & Migration

- [x] Task: Write schema tests for `lists` table (columns, constraints, foreign key) de3c4cf
  - [x] Verify tests fail
  - [x] Implement `lists` table in `src/lib/db/schema/lists.ts`
  - [x] Add `lists` export to schema index/barrel file
  - [x] Generate and run Drizzle migration (`npm run db:generate`, `npm run db:push`)
  - [x] Verify schema tests pass
  - [x] Commit: `feat(schema): Add lists table with board FK and position`
- [x] Task: Update board creation to auto-create default "To Do" list atomically f5697a4
  - [x] Write tests for `createBoard` default list side effect
  - [x] Modify `createBoard` data function to insert board + list in a transaction
  - [x] Verify tests pass
  - [x] Commit: `feat(boards): Auto-create default To Do list on board creation`
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) 28522f8

## Phase 2: Data Layer (List CRUD)

- [x] Task: Implement `createList` data function 3712cee
  - [x] Write unit tests for `createList`
  - [x] Implement `createList` with auto-position assignment
  - [x] Verify tests pass
  - [x] Commit: `feat(lists): Add createList data function`
- [x] Task: Implement `getListsByBoardId` data function ca514e2
  - [x] Write unit tests for `getListsByBoardId`
  - [x] Implement `getListsByBoardId` with owner-scoped board verification
  - [x] Verify tests pass
  - [x] Commit: `feat(lists): Add getListsByBoardId data function`
- [x] Task: Implement `renameList` data function b820053
  - [x] Write unit tests for `renameList`
  - [x] Implement `renameList` with owner-scoped verification
  - [x] Verify tests pass
  - [x] Commit: `feat(lists): Add renameList data function`
- [x] Task: Implement `deleteList` data function 1da6b02
  - [x] Write unit tests for `deleteList`
  - [x] Implement `deleteList` with position recompaction
  - [x] Verify tests pass
  - [x] Commit: `feat(lists): Add deleteList data function with position recompaction`
- [x] Task: Implement `reorderLists` data function 1293f7b
  - [x] Write unit tests for `reorderLists`
  - [x] Implement `reorderLists` with bulk position update
  - [x] Verify tests pass
  - [x] Commit: `feat(lists): Add reorderLists data function`
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md) 28522f8

## Phase 3: Validation Schemas & Server Actions

- [x] Task: Create Zod validation schemas for list operations 19736ba
  - [x] Write tests for list Zod schemas
  - [x] Implement `createListSchema`, `renameListSchema`, `reorderListsSchema`
  - [x] Verify tests pass
  - [x] Commit: `feat(schemas): Add Zod validation for list operations`
- [x] Task: Implement `createList` Server Action bc3f14d
  - [x] Write integration tests for `createList` action
  - [x] Implement `createList` Server Action with auth + validation
  - [x] Verify tests pass
  - [x] Commit: `feat(actions): Add Server Actions for list operations`
- [x] Task: Implement `renameList` Server Action bc3f14d
  - [x] Write integration tests for `renameList` action
  - [x] Implement `renameList` Server Action with auth + validation
  - [x] Verify tests pass
  - [x] Commit: `feat(actions): Add Server Actions for list operations`
- [x] Task: Implement `deleteList` Server Action bc3f14d
  - [x] Write integration tests for `deleteList` action
  - [x] Implement `deleteList` Server Action with auth + validation
  - [x] Verify tests pass
  - [x] Commit: `feat(actions): Add Server Actions for list operations`
- [x] Task: Implement `reorderLists` Server Action bc3f14d
  - [x] Write integration tests for `reorderLists` action
  - [x] Implement `reorderLists` Server Action with auth + validation
  - [x] Verify tests pass
  - [x] Commit: `feat(actions): Add Server Actions for list operations`
- [x] Task: Refactor: Owner-scope `createList` and wire `userId` through actions 0bf34db
  - [x] Verify tests pass
  - [x] Commit: `feat(actions): Owner-scope createList and wire userId through actions`
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md) 28522f8

## Phase 4: UI Components

- [x] Task: Install dnd-kit dependencies (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) fe33fd9
  - [x] Verify installation and typecheck
  - [x] Commit: `chore(deps): Add dnd-kit for list drag-and-drop`
- [x] Task: Build `ListColumn` component 777d6c9
  - [x] Write component tests for `ListColumn`
  - [x] Implement `ListColumn` with title, inline rename, delete button, card placeholder
  - [x] Verify tests pass
  - [x] Commit: `feat(ui): Add ListColumn component`
- [x] Task: Build `AddListForm` inline component b49be27
  - [x] Write component tests for `AddListForm`
  - [x] Implement inline input with Enter/blur submit and Escape cancel
  - [x] Verify tests pass
  - [x] Commit: `feat(ui): Add AddListForm inline component`
- [x] Task: Build `BoardLists` container component 6d97f9a
  - [x] Write component tests for `BoardLists`
  - [x] Implement horizontal scrollable container rendering `ListColumn` array
  - [x] Verify tests pass
  - [x] Commit: `feat(ui): Add BoardLists container component`
- [x] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md) 28522f8

## Phase 5: Board Page Integration & DnD

- [x] Task: Integrate lists into `/boards/[boardId]/page.tsx` bd21875
  - [x] Fetch lists via `getListsByBoardId` in the Server Component
  - [x] Replace empty state with `BoardLists` component
  - [x] Verify page renders correctly with lists
  - [x] Commit: `feat(board): Integrate lists into board detail page with DnD wiring`
- [x] Task: Implement drag-and-drop reordering bd21875
  - [x] Write component/integration tests for DnD behavior
  - [x] Wrap `BoardLists` with `DndContext` and `SortableContext`
  - [x] Connect `reorderLists` Server Action to drag end event
  - [x] Implement optimistic UI update with rollback on error
  - [x] Add keyboard accessibility handlers
  - [x] Verify tests pass
  - [x] Commit: `feat(board): Integrate lists into board detail page with DnD wiring`
- [x] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md) 28522f8

## Phase 6: E2E Tests & Final Verification

- [x] Task: Write E2E tests for list CRUD flows cdd4ed7
  - [x] E2E test: Create a board and verify default "To Do" list appears
  - [x] E2E test: Create a new list
  - [x] E2E test: Rename a list inline
  - [x] E2E test: Delete a list with confirmation
  - [x] E2E test: Reorder lists via drag-and-drop
  - [x] Verify all E2E tests pass
  - [x] Commit: `test(e2e): Add list management end-to-end tests`
- [x] Task: Final verification and coverage check 28522f8
  - [x] Run full test suite: `npm test`
  - [x] Run typecheck: `npm run typecheck`
  - [x] Run lint: `npm run lint`
  - [x] Verify ≥ 80% code coverage
  - [x] Manual smoke test in browser
  - [x] Commit: `chore(conductor): Mark track 'Implement board lists (create, rename, delete, reorder)' as complete`
- [x] Task: Conductor - User Manual Verification 'Phase 6' (Protocol in workflow.md) 28522f8

## Out-of-Plan Notes

- Cards implementation is deferred to the next track; card placeholders are visual only
- Real-time collaboration for lists is deferred to a future Socket.io track

## Phase: Review Fixes

- [x] Task: Apply review suggestions 6763804
  - [x] Commit untracked planning docs
  - [x] Mark plan tasks complete with commit SHAs
  - [x] BoardLists: remove misleading render-time sync comment + simplify id-sequence guard
  - [x] ListColumn: rewrite delete dialog copy to match spec
  - [x] AddListForm: close form after successful add
  - [x] reorderLists: reject duplicate ids in input
  - [x] reorderListsAction: wrap data call in try/catch
  - [x] Tests: cover new behaviors
  - [x] e2e: replace dragTo with explicit mouse events
  - [x] Commit: `fix(conductor): Apply review suggestions for track 'lists_20260630'`
- [x] Task: Fix optimistic reorder flicker 5a0288c
  - [x] BoardLists: replace render-time id-sequence sync with render-time
        prop-reference sync (uses a tracking state variable, not a ref, to
        comply with the react-hooks/refs lint rule)
  - [x] Add regression test that simulates a drag with synthetic pointer
        events and asserts the optimistic order survives a re-render
  - [x] Commit: `fix(lists): Stop reverting optimistic reorder on the next render`
