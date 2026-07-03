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
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Decompose useCardDetail into Focused Hooks' (Protocol in workflow.md)

## Phase 2: Decompose CardDetailHeader into Focused Sub-Components

- [ ] Task: Extract `TitleBar` component
  - [ ] Title input + copy/move/delete action buttons
  - [ ] Accept only: title, onTitleChange, onCopy, onMoveRequest, onDeleteRequest, isPending
- [ ] Task: Extract `MovePopover` component
  - [ ] Move card popover with list selection
  - [ ] Accept only: open, onOpenChange, lists, currentListId, onMove, isPending
- [ ] Task: Extract `DueDateField` component
  - [ ] Date input + clear button (already partially extracted, promote to standalone)
  - [ ] Accept only: value, onChange, isPending
- [ ] Task: Rewrite `CardDetailHeader` as a thin composition of TitleBar, MovePopover, DueDateField, LabelsControl, AssigneesControl
  - [ ] Each sub-component receives only its required props (2-5 each)
- [ ] Task: Update `card-detail.test.tsx` to match new component structure
- [ ] Task: Verify typecheck, lint, tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Decompose CardDetailHeader into Focused Sub-Components' (Protocol in workflow.md)

## Phase 3: BoardCards List Actions Extraction

- [ ] Task: Create `useListActions` hook
  - [ ] Extract handleAddList, handleRenameList, handleDeleteList from BoardCards
  - [ ] Accept boardId, return stable action functions
- [ ] Task: Write tests for `useListActions`
- [ ] Task: Refactor `BoardCards` to use `useListActions`
- [ ] Task: Update board-cards DnD tests if needed
- [ ] Task: Verify typecheck, lint, tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: BoardCards List Actions Extraction' (Protocol in workflow.md)

## Phase 4: Final Integration & Cleanup

- [ ] Task: Remove unused exports and dead code from old interfaces
- [ ] Task: Run full test suite, typecheck, lint
- [ ] Task: Manual E2E verification of card detail workflow
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Integration & Cleanup' (Protocol in workflow.md)
