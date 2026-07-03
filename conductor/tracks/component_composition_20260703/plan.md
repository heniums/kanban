# Implementation Plan: Component Composition Refactor

## Phase 1: Decompose useCardDetail into Focused Hooks

- [x] Task: Create `useCardLabels` hook
  - [x] Extract handleCreateLabel, handleUpdateLabel, handleDeleteLabel, newlyCreatedLabelIds state
  - [x] Accept boardId, return handlers + state
- [x] Task: Create `useCardMove` hook
  - [x] Extract moveOpen state, handleMove logic
  - [x] Accept data, lists, return moveOpen, setMoveOpen, handleMove
- [x] Task: Create `useCardDelete` hook
  - [x] Extract deleteOpen state, handleDelete logic
  - [x] Accept data, return deleteOpen, setDeleteOpen, handleDelete
- [x] Task: Create `useCardCopy` hook
  - [x] Extract handleCopy logic
  - [x] Accept data, return handleCopy
- [x] Task: Refactor `useCardDetail` to compose the new sub-hooks
  - [x] Replace inlined logic with calls to sub-hooks
  - [x] Remove debug console.log statements
- [x] Task: Write tests for new sub-hooks
- [x] Task: Verify typecheck, lint, tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 1: Decompose useCardDetail into Focused Hooks' (Protocol in workflow.md)

## Phase 2: Decompose CardDetailHeader into Focused Sub-Components

- [x] Task: Extract `TitleBar` component
  - [x] Title input + copy/move/delete action buttons
  - [x] Accept only: title, onTitleChange, onCopy, onMoveRequest, onDeleteRequest, isPending
- [x] Task: Extract `MovePopover` component
  - [x] Move card popover with list selection
  - [x] Accept only: open, onOpenChange, lists, currentListId, onMove, isPending
- [x] Task: Extract `DueDateField` component
  - [x] Date input + clear button (already partially extracted, promote to standalone)
  - [x] Accept only: value, onChange, isPending
- [x] Task: Rewrite `CardDetailHeader` as a thin composition of TitleBar, MovePopover, DueDateField, LabelsControl, AssigneesControl
  - [x] Each sub-component receives only its required props (2-5 each)
- [x] Task: Update `card-detail.test.tsx` to match new component structure
- [x] Task: Verify typecheck, lint, tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 2: Decompose CardDetailHeader into Focused Sub-Components' (Protocol in workflow.md)

## Phase 3: BoardCards List Actions Extraction

- [x] Task: Create `useListActions` hook
  - [x] Extract handleAddList, handleRenameList, handleDeleteList from BoardCards
  - [x] Accept boardId, return stable action functions
- [x] Task: Write tests for `useListActions`
- [x] Task: Refactor `BoardCards` to use `useListActions`
- [x] Task: Update board-cards DnD tests if needed
- [x] Task: Verify typecheck, lint, tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: BoardCards List Actions Extraction' (Protocol in workflow.md)

## Phase 4: Final Integration & Cleanup

- [ ] Task: Remove unused exports and dead code from old interfaces
- [ ] Task: Run full test suite, typecheck, lint
- [ ] Task: Manual E2E verification of card detail workflow
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Integration & Cleanup' (Protocol in workflow.md)
