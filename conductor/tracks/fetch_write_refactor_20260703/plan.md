# Implementation Plan: Eliminate Unnecessary Fetch-Before-Write in Data Layer

## Phase 1: Remove existence-check SELECTs from createList and createLabel

- [x] Task: Write/update tests for createList and createLabel
  - [x] Verify tests cover successful creation without a pre-existing board context
  - [x] Verify tests cover the FK constraint error path when boardId is invalid
  - [x] Remove any test assertions that depend on the removed 'Board not found' error
- [x] Task: Implement refactor — remove board SELECT from createList (`src/lib/data/lists/create.ts`)
  - [x] Remove the `select` + `throw` block (lines 12-20)
  - [x] Remove the `boards` import if no longer used in the file
- [x] Task: Implement refactor — remove board SELECT from createLabel (`src/lib/data/labels/index.ts`)
  - [x] Remove the `select` + `throw` block (lines 12-20)
  - [x] Remove the `boards` import if no longer used elsewhere in the file (note: `boards` is still used in `updateLabel`, `deleteLabel`, `getLabelById`)
- [x] Task: Verify tests pass, typecheck, and lint
  - [x] `npm test`
  - [x] `npm run typecheck`
  - [x] `npm run lint`
- [x] Task: Commit changes
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Remove assertCardOwnedBy guard from createChecklist and createComment

- [x] Task: Write/update tests for createChecklist and createComment
  - [x] Verify tests cover successful creation
  - [x] Verify tests cover FK constraint violation when cardId is invalid
  - [x] Remove test assertions that depend on 'Card not found or board not owned' error
- [x] Task: Implement refactor — remove assertCardOwnedBy from checklists (`src/lib/data/checklists/mutations.ts`)
  - [x] Remove the `assertCardOwnedBy` function definition (lines 12-23)
  - [x] Remove the `assertCardOwnedBy(tx, ...)` call in `createChecklist` (line 31)
- [x] Task: Implement refactor — remove assertCardOwnedBy from comments (`src/lib/data/comments/mutations.ts`)
  - [x] Remove the `assertCardOwnedBy` function definition (lines 9-18)
  - [x] Remove the `assertCardOwnedBy(tx, ...)` call in `createComment` (line 26)
- [x] Task: Verify tests pass, typecheck, and lint
  - [x] `npm test`
  - [x] `npm run typecheck`
  - [x] `npm run lint`
- [x] Task: Commit changes
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Eliminate createChecklistItem's parent checklist SELECT

- [x] Task: Write/update tests for createChecklistItem
  - [x] Verify test covers successful creation
  - [x] Verify test covers FK constraint violation when checklistId is invalid
  - [x] Remove test assertions that depend on 'Checklist not found' error
- [x] Task: Implement refactor — remove parent SELECT from createChecklistItem (`src/lib/data/checklists/mutations.ts`)
  - [x] Remove the `select` + `throw` block (lines 74-82)
  - [x] Remove the now-unused `parent` variable declaration
- [x] Task: Verify tests pass, typecheck, and lint
  - [x] `npm test`
  - [x] `npm run typecheck`
  - [x] `npm run lint`
- [x] Task: Commit changes
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Remove updateCard's else-branch card SELECT

- [x] Task: Write/update tests for updateCard
  - [x] Verify test covers label-only and assignee-only updates
  - [x] Ensure test covers the case where only labelIds/assigneeIds change (no scalar fields)
  - [x] Remove test assertions that depended on `null` return for non-existent cards (FK will throw instead)
- [x] Task: Implement refactor — simplify updateCard's empty-patch branch (`src/lib/data/cards/mutations.ts`)
  - [x] Remove the else-branch SELECT (lines 85-93)
  - [x] Allow label/assignee mutations to proceed without the pre-fetch; select the card post-mutation if needed to return a result
  - [x] Ensure the function still returns `Card | null` with consistent semantics
- [x] Task: Verify tests pass, typecheck, and lint
  - [x] `npm test`
  - [x] `npm run typecheck`
  - [x] `npm run lint`
- [x] Task: Commit changes
- [x] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: Final integration verification

- [x] Task: Full test suite verification
  - [x] `npm test` — all tests pass
  - [x] `npm run typecheck` — no errors
  - [x] `npm run lint` — no errors
- [x] Task: Conductor - User Manual Verification 'Phase 5 - Final Integration' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions 62d9cef
