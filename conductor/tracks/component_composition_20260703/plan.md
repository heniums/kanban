# Implementation Plan: Component Composition Refactor

## Phase 1: Decompose useCardDetail into Focused Hooks

- [ ] Task: Create `useCardLabels` hook
  - [ ] Extract handleCreateLabel, handleUpdateLabel, handleDeleteLabel, newlyCreatedLabelIds state
  - [ ] Accept boardId, return handlers + state
- [ ] Task: Create `useCardMove` hook
  - [ ] Extract moveOpen state, handleMove logic
  - [ ] Accept data, lists, return moveOpen, setMoveOpen, handleMove
- [ ] Task: Create `useCardDelete` hook
  - [ ] Extract deleteOpen state, handleDelete logic
  - [ ] Accept data, return deleteOpen, setDeleteOpen, handleDelete
- [ ] Task: Create `useCardCopy` hook
  - [ ] Extract handleCopy logic
  - [ ] Accept data, return handleCopy
- [ ] Task: Refactor `useCardDetail` to compose the new sub-hooks
  - [ ] Replace inlined logic with calls to sub-hooks
  - [ ] Remove debug console.log statements
- [ ] Task: Write tests for new sub-hooks
- [ ] Task: Verify typecheck, lint, tests pass
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
