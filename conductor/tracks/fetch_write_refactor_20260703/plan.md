# Implementation Plan: Eliminate Unnecessary Fetch-Before-Write in Data Layer

## Phase 1: Remove existence-check SELECTs from createList and createLabel

- [ ] Task: Write/update tests for createList and createLabel
  - [ ] Verify tests cover successful creation without a pre-existing board context
  - [ ] Verify tests cover the FK constraint error path when boardId is invalid
  - [ ] Remove any test assertions that depend on the removed 'Board not found' error
- [ ] Task: Implement refactor — remove board SELECT from createList (`src/lib/data/lists/create.ts`)
  - [ ] Remove the `select` + `throw` block (lines 12-20)
  - [ ] Remove the `boards` import if no longer used in the file
- [ ] Task: Implement refactor — remove board SELECT from createLabel (`src/lib/data/labels/index.ts`)
  - [ ] Remove the `select` + `throw` block (lines 12-20)
  - [ ] Remove the `boards` import if no longer used elsewhere in the file (note: `boards` is still used in `updateLabel`, `deleteLabel`, `getLabelById`)
- [ ] Task: Verify tests pass, typecheck, and lint
  - [ ] `npm test`
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
- [ ] Task: Commit changes
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Remove assertCardOwnedBy guard from createChecklist and createComment

- [ ] Task: Write/update tests for createChecklist and createComment
  - [ ] Verify tests cover successful creation
  - [ ] Verify tests cover FK constraint violation when cardId is invalid
  - [ ] Remove test assertions that depend on 'Card not found or board not owned' error
- [ ] Task: Implement refactor — remove assertCardOwnedBy from checklists (`src/lib/data/checklists/mutations.ts`)
  - [ ] Remove the `assertCardOwnedBy` function definition (lines 12-23)
  - [ ] Remove the `assertCardOwnedBy(tx, ...)` call in `createChecklist` (line 31)
- [ ] Task: Implement refactor — remove assertCardOwnedBy from comments (`src/lib/data/comments/mutations.ts`)
  - [ ] Remove the `assertCardOwnedBy` function definition (lines 9-18)
  - [ ] Remove the `assertCardOwnedBy(tx, ...)` call in `createComment` (line 26)
- [ ] Task: Verify tests pass, typecheck, and lint
  - [ ] `npm test`
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
- [ ] Task: Commit changes
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Eliminate createChecklistItem's parent checklist SELECT

- [ ] Task: Write/update tests for createChecklistItem
  - [ ] Verify test covers successful creation
  - [ ] Verify test covers FK constraint violation when checklistId is invalid
  - [ ] Remove test assertions that depend on 'Checklist not found' error
- [ ] Task: Implement refactor — remove parent SELECT from createChecklistItem (`src/lib/data/checklists/mutations.ts`)
  - [ ] Remove the `select` + `throw` block (lines 74-82)
  - [ ] Remove the now-unused `parent` variable declaration
- [ ] Task: Verify tests pass, typecheck, and lint
  - [ ] `npm test`
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
- [ ] Task: Commit changes
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Remove updateCard's else-branch card SELECT

- [ ] Task: Write/update tests for updateCard
  - [ ] Verify test covers label-only and assignee-only updates
  - [ ] Ensure test covers the case where only labelIds/assigneeIds change (no scalar fields)
  - [ ] Remove test assertions that depended on `null` return for non-existent cards (FK will throw instead)
- [ ] Task: Implement refactor — simplify updateCard's empty-patch branch (`src/lib/data/cards/mutations.ts`)
  - [ ] Remove the else-branch SELECT (lines 85-93)
  - [ ] Allow label/assignee mutations to proceed without the pre-fetch; select the card post-mutation if needed to return a result
  - [ ] Ensure the function still returns `Card | null` with consistent semantics
- [ ] Task: Verify tests pass, typecheck, and lint
  - [ ] `npm test`
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
- [ ] Task: Commit changes
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: Final integration verification

- [ ] Task: Full test suite verification
  - [ ] `npm test` — all tests pass
  - [ ] `npm run typecheck` — no errors
  - [ ] `npm run lint` — no errors
- [ ] Task: Conductor - User Manual Verification 'Phase 5 - Final Integration' (Protocol in workflow.md)
