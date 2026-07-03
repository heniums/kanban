# Implementation Plan: Component Composition Refactor

## Phase 1: Card Detail Context & Core Decomposition

- [ ] Task: Write tests for CardDetailContext provider and consumer pattern
  - [ ] Test that context provides card data, draft state, pending status
  - [ ] Test that context provides action handlers (save, delete, move, copy)
  - [ ] Test that components outside the provider throw or render null
- [ ] Task: Create CardDetailContext and provider component
  - [ ] Define context shape (data, draft, isPending, actions)
  - [ ] Create `CardDetailProvider` that wraps `useCardDetail` logic
  - [ ] Create `useCardDetailContext` consumer hook
- [ ] Task: Refactor `CardDetail` to use the new provider
  - [ ] Replace direct `useCardDetail` usage with `CardDetailProvider`
  - [ ] Compose child components inside the provider
- [ ] Task: Decompose `CardDetailHeader` into composable sub-components
  - [ ] Extract `TitleBar` (title input + copy/move/delete actions)
  - [ ] Extract `MovePopover` (move card popover with list selection)
  - [ ] Extract `DueDateField` (date input + clear button)
  - [ ] Each sub-component consumes context instead of receiving props
- [ ] Task: Remove debug console.log statements from use-card-detail.ts
- [ ] Task: Update existing card-detail tests to match new API
- [ ] Task: Verify typecheck, lint, and tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Card Detail Context & Core Decomposition' (Protocol in workflow.md)

## Phase 2: Labels & Assignees Field Extraction

- [ ] Task: Write tests for LabelsField composable component
  - [ ] Test label toggle, create, update, delete behavior
  - [ ] Test that it consumes context for board labels and draft state
- [ ] Task: Write tests for AssigneesField composable component
  - [ ] Test assignee toggle behavior
  - [ ] Test that it consumes context for board members and draft state
- [ ] Task: Extract `LabelsField` from card-detail-labels into context-consuming component
  - [ ] Move label CRUD handlers (create, update, delete) into the component or a dedicated sub-hook
  - [ ] Remove label-related props from CardDetailHeader interface
- [ ] Task: Extract `AssigneesField` from card-detail-assignees into context-consuming component
  - [ ] Remove assignee-related props from CardDetailHeader interface
- [ ] Task: Update existing tests for labels and assignees components
- [ ] Task: Verify typecheck, lint, and tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Labels & Assignees Field Extraction' (Protocol in workflow.md)

## Phase 3: BoardCards List Actions Extraction

- [ ] Task: Write tests for `useListActions` hook
  - [ ] Test add list action with success/error paths
  - [ ] Test rename list action with success/error paths
  - [ ] Test delete list action with success/error paths
- [ ] Task: Create `useListActions` hook
  - [ ] Extract handleAddList, handleRenameList, handleDeleteList from BoardCards
  - [ ] Hook accepts boardId and returns stable action functions
- [ ] Task: Refactor `BoardCards` to use `useListActions`
  - [ ] Replace inline handler closures with hook-provided functions
  - [ ] Verify drag-and-drop still works correctly
- [ ] Task: Update existing board-cards DnD tests if needed
- [ ] Task: Verify typecheck, lint, and tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: BoardCards List Actions Extraction' (Protocol in workflow.md)

## Phase 4: Final Integration & Cleanup

- [ ] Task: Remove unused exports and dead code from old interfaces
  - [ ] Remove old `CardDetailHeaderProps` interface if no longer needed
  - [ ] Clean up any remaining prop-drilling patterns
- [ ] Task: Run full test suite and verify all tests pass
- [ ] Task: Run typecheck and lint — fix any remaining issues
- [ ] Task: Manual E2E verification of card detail workflow
  - [ ] Open card detail dialog
  - [ ] Edit title, description, labels, assignees, due date
  - [ ] Move card to different list
  - [ ] Copy card
  - [ ] Delete card
  - [ ] Verify checklists and comments still work
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Integration & Cleanup' (Protocol in workflow.md)
