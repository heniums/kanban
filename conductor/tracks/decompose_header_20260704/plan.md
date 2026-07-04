# Plan: Decompose CardDetailHeader

## Phase 1: Capture Current Behavior with Tests

- [ ] Task: Write a component render test for `CardDetail` that snapshots the header area (TitleBar, "in list" subtitle, MetadataBar with due date, labels, assignees) to lock in the current visual structure.
  - [ ] Create test file at `src/components/cards/__tests__/card-detail-header.test.tsx`
  - [ ] Render `<CardDetail>` with mock data covering all header fields
  - [ ] Assert that TitleBar, "in list" text, DueDateField, LabelsControl, and AssigneesControl are present
- [ ] Task: Verify tests pass with current implementation (`npm test`)
- [ ] Task: Conductor - User Manual Verification 'Capture Current Behavior with Tests' (Protocol in workflow.md)

## Phase 2: Inline Components into Parent

- [ ] Task: Move `TitleBar` rendering into `card-detail.tsx`
  - [ ] Import `TitleBar` and `MovePopover` directly in `card-detail.tsx`
  - [ ] Render `<TitleBar>` with all required props (title, onTitleChange, onCopy, moveTrigger, onDeleteRequest, isPending)
  - [ ] Render `<MovePopover>` as the `moveTrigger` prop
- [ ] Task: Move "in list" subtitle into `card-detail.tsx`
  - [ ] Render the "in list …" text directly below `<TitleBar>` in `card-detail.tsx`
- [ ] Task: Move `MetadataBar` and metadata fields into `card-detail.tsx`
  - [ ] Import `MetadataBar`, `MetadataField` (from card-detail-header or relocate), `DueDateField`, `LabelsControl`, `AssigneesControl` directly in `card-detail.tsx`
  - [ ] Render `<MetadataBar>` with three `<MetadataField>` children (Due date, Labels, Assignees)
  - [ ] Wire all props correctly from `useCardDetail` hook
- [ ] Task: Verify tests still pass after inlining (`npm test`)
- [ ] Task: Conductor - User Manual Verification 'Inline Components into Parent' (Protocol in workflow.md)

## Phase 3: Cleanup

- [ ] Task: Delete `card-detail-header.tsx`
  - [ ] Remove the file `src/components/cards/card-detail/card-detail-header.tsx`
  - [ ] Remove `CardDetailHeader` import from `card-detail.tsx`
  - [ ] Move `MetadataBar` and `MetadataField` to a new file `card-detail-metadata.tsx` if they are to be kept as reusable primitives
- [ ] Task: Remove unused imports and types
  - [ ] Clean up `CardDetailHeaderProps` type if no longer referenced
  - [ ] Remove any dead imports in `card-detail.tsx`
- [ ] Task: Run full verification suite
  - [ ] `npm run typecheck` passes
  - [ ] `npm run lint` passes
  - [ ] `npm test` passes
- [ ] Task: Conductor - User Manual Verification 'Cleanup' (Protocol in workflow.md)
