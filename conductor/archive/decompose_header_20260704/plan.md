# Plan: Decompose CardDetailHeader

## Phase 1: Capture Current Behavior with Tests

- [x] Task: Write a component render test for `CardDetail` that snapshots the header area (TitleBar, "in list" subtitle, MetadataBar with due date, labels, assignees) to lock in the current visual structure.
  - [x] Create test file at `src/components/cards/__tests__/card-detail-header.test.tsx`
  - [x] Render `<CardDetail>` with mock data covering all header fields
  - [x] Assert that TitleBar, "in list" text, DueDateField, LabelsControl, and AssigneesControl are present
- [x] Task: Verify tests pass with current implementation (`npm test`)
- [x] Task: Conductor - User Manual Verification 'Capture Current Behavior with Tests' (Protocol in workflow.md)

## Phase 2: Inline Components into Parent

- [x] Task: Move `TitleBar` rendering into `card-detail.tsx`
  - [x] Import `TitleBar` and `MovePopover` directly in `card-detail.tsx`
  - [x] Render `<TitleBar>` with all required props (title, onTitleChange, onCopy, moveTrigger, onDeleteRequest, isPending)
  - [x] Render `<MovePopover>` as the `moveTrigger` prop
- [x] Task: Move "in list" subtitle into `card-detail.tsx`
  - [x] Render the "in list …" text directly below `<TitleBar>` in `card-detail.tsx`
- [x] Task: Move `MetadataBar` and metadata fields into `card-detail.tsx`
  - [x] Import `MetadataBar`, `MetadataField` (from card-detail-header or relocate), `DueDateField`, `LabelsControl`, `AssigneesControl` directly in `card-detail.tsx`
  - [x] Render `<MetadataBar>` with three `<MetadataField>` children (Due date, Labels, Assignees)
  - [x] Wire all props correctly from `useCardDetail` hook
- [x] Task: Verify tests still pass after inlining (`npm test`)
- [ ] Task: Conductor - User Manual Verification 'Inline Components into Parent' (Protocol in workflow.md)

## Phase 3: Cleanup

- [x] Task: Delete `card-detail-header.tsx`
  - [x] Remove the file `src/components/cards/card-detail/card-detail-header.tsx`
  - [x] Remove `CardDetailHeader` import from `card-detail.tsx`
  - [x] Move `MetadataBar` and `MetadataField` to a new file `card-detail-metadata.tsx` if they are to be kept as reusable primitives
- [x] Task: Remove unused imports and types
  - [x] Clean up `CardDetailHeaderProps` type if no longer referenced
  - [x] Remove any dead imports in `card-detail.tsx`
- [x] Task: Run full verification suite
  - [x] `npm run typecheck` passes
  - [x] `npm run lint` passes
  - [x] `npm test` passes
- [x] Task: Conductor - User Manual Verification 'Cleanup' (Protocol in workflow.md)
