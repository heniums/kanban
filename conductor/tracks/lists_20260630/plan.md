# Implementation Plan: Board Lists Management

## Phase 1: Database Schema & Migration

- [ ] Task: Write schema tests for `lists` table (columns, constraints, foreign key)
  - [ ] Verify tests fail
  - [ ] Implement `lists` table in `src/lib/db/schema/lists.ts`
  - [ ] Add `lists` export to schema index/barrel file
  - [ ] Generate and run Drizzle migration (`npm run db:generate`, `npm run db:push`)
  - [ ] Verify schema tests pass
  - [ ] Commit: `feat(schema): Add lists table with board FK and position`
- [ ] Task: Update board creation to auto-create default "To Do" list atomically
  - [ ] Write tests for `createBoard` default list side effect
  - [ ] Modify `createBoard` data function to insert board + list in a transaction
  - [ ] Verify tests pass
  - [ ] Commit: `feat(boards): Auto-create default To Do list on board creation`
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Data Layer (List CRUD)

- [ ] Task: Implement `createList` data function
  - [ ] Write unit tests for `createList`
  - [ ] Implement `createList` with auto-position assignment
  - [ ] Verify tests pass
  - [ ] Commit: `feat(lists): Add createList data function`
- [ ] Task: Implement `getListsByBoardId` data function
  - [ ] Write unit tests for `getListsByBoardId`
  - [ ] Implement `getListsByBoardId` with owner-scoped board verification
  - [ ] Verify tests pass
  - [ ] Commit: `feat(lists): Add getListsByBoardId data function`
- [ ] Task: Implement `renameList` data function
  - [ ] Write unit tests for `renameList`
  - [ ] Implement `renameList` with owner-scoped verification
  - [ ] Verify tests pass
  - [ ] Commit: `feat(lists): Add renameList data function`
- [ ] Task: Implement `deleteList` data function
  - [ ] Write unit tests for `deleteList`
  - [ ] Implement `deleteList` with position recompaction
  - [ ] Verify tests pass
  - [ ] Commit: `feat(lists): Add deleteList data function with position recompaction`
- [ ] Task: Implement `reorderLists` data function
  - [ ] Write unit tests for `reorderLists`
  - [ ] Implement `reorderLists` with bulk position update
  - [ ] Verify tests pass
  - [ ] Commit: `feat(lists): Add reorderLists data function`
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Validation Schemas & Server Actions

- [ ] Task: Create Zod validation schemas for list operations
  - [ ] Write tests for list Zod schemas
  - [ ] Implement `createListSchema`, `renameListSchema`, `reorderListsSchema`
  - [ ] Verify tests pass
  - [ ] Commit: `feat(schemas): Add Zod validation for list operations`
- [ ] Task: Implement `createList` Server Action
  - [ ] Write integration tests for `createList` action
  - [ ] Implement `createList` Server Action with auth + validation
  - [ ] Verify tests pass
  - [ ] Commit: `feat(actions): Add createList Server Action`
- [ ] Task: Implement `renameList` Server Action
  - [ ] Write integration tests for `renameList` action
  - [ ] Implement `renameList` Server Action with auth + validation
  - [ ] Verify tests pass
  - [ ] Commit: `feat(actions): Add renameList Server Action`
- [ ] Task: Implement `deleteList` Server Action
  - [ ] Write integration tests for `deleteList` action
  - [ ] Implement `deleteList` Server Action with auth + validation
  - [ ] Verify tests pass
  - [ ] Commit: `feat(actions): Add deleteList Server Action`
- [ ] Task: Implement `reorderLists` Server Action
  - [ ] Write integration tests for `reorderLists` action
  - [ ] Implement `reorderLists` Server Action with auth + validation
  - [ ] Verify tests pass
  - [ ] Commit: `feat(actions): Add reorderLists Server Action`
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: UI Components

- [ ] Task: Install dnd-kit dependencies (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
  - [ ] Verify installation and typecheck
  - [ ] Commit: `chore(deps): Add dnd-kit for list drag-and-drop`
- [ ] Task: Build `ListColumn` component
  - [ ] Write component tests for `ListColumn`
  - [ ] Implement `ListColumn` with title, inline rename, delete button, card placeholder
  - [ ] Verify tests pass
  - [ ] Commit: `feat(ui): Add ListColumn component`
- [ ] Task: Build `AddListForm` inline component
  - [ ] Write component tests for `AddListForm`
  - [ ] Implement inline input with Enter/blur submit and Escape cancel
  - [ ] Verify tests pass
  - [ ] Commit: `feat(ui): Add AddListForm inline component`
- [ ] Task: Build `BoardLists` container component
  - [ ] Write component tests for `BoardLists`
  - [ ] Implement horizontal scrollable container rendering `ListColumn` array
  - [ ] Verify tests pass
  - [ ] Commit: `feat(ui): Add BoardLists container component`
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: Board Page Integration & DnD

- [ ] Task: Integrate lists into `/boards/[boardId]/page.tsx`
  - [ ] Fetch lists via `getListsByBoardId` in the Server Component
  - [ ] Replace empty state with `BoardLists` component
  - [ ] Verify page renders correctly with lists
  - [ ] Commit: `feat(board): Integrate lists into board detail page`
- [ ] Task: Implement drag-and-drop reordering
  - [ ] Write component/integration tests for DnD behavior
  - [ ] Wrap `BoardLists` with `DndContext` and `SortableContext`
  - [ ] Connect `reorderLists` Server Action to drag end event
  - [ ] Implement optimistic UI update with rollback on error
  - [ ] Add keyboard accessibility handlers
  - [ ] Verify tests pass
  - [ ] Commit: `feat(board): Add drag-and-drop list reordering`
- [ ] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)

## Phase 6: E2E Tests & Final Verification

- [ ] Task: Write E2E tests for list CRUD flows
  - [ ] E2E test: Create a board and verify default "To Do" list appears
  - [ ] E2E test: Create a new list
  - [ ] E2E test: Rename a list inline
  - [ ] E2E test: Delete a list with confirmation
  - [ ] E2E test: Reorder lists via drag-and-drop
  - [ ] Verify all E2E tests pass
  - [ ] Commit: `test(e2e): Add list management end-to-end tests`
- [ ] Task: Final verification and coverage check
  - [ ] Run full test suite: `npm test`
  - [ ] Run typecheck: `npm run typecheck`
  - [ ] Run lint: `npm run lint`
  - [ ] Verify ≥ 80% code coverage
  - [ ] Manual smoke test in browser
  - [ ] Commit: `chore: Final verification and cleanup`
- [ ] Task: Conductor - User Manual Verification 'Phase 6' (Protocol in workflow.md)

## Out-of-Plan Notes

- Cards implementation is deferred to the next track; card placeholders are visual only
- Real-time collaboration for lists is deferred to a future Socket.io track
