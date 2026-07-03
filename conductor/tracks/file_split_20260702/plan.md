# Implementation Plan: Split Large Files (Refactor)

## Phase 1: Discovery & Baseline

- [ ] Task: Run existing test suite to establish baseline
  - [ ] Run `npm test` and confirm all tests pass
  - [ ] Run `npm run typecheck` and confirm no errors
  - [ ] Run `npm run lint` and confirm no errors
- [ ] Task: Discover large files in `src/`
  - [ ] Scan entire `src/` tree for files exceeding 300 lines
  - [ ] Review each candidate for multiple responsibilities
  - [ ] Document the final list of files to split
- [ ] Task: Conductor - User Manual Verification 'Discovery & Baseline' (Protocol in workflow.md)

## Phase 2: Split `src/components/cards/card-detail.tsx`

- [ ] Task: Analyze and plan card-detail sub-component boundaries
  - [ ] Review the 1623-line file and identify all sub-components, hooks, and utilities
  - [ ] Determine logical groupings and file boundaries
  - [ ] Document the split plan (which sub-components go to which files)
- [ ] Task: Extract sub-components into `src/components/cards/card-detail/` directory
  - [ ] Create the `card-detail/` directory
  - [ ] Extract each sub-component into its own file
  - [ ] Keep `card-detail.tsx` as the orchestrator composing extracted pieces
  - [ ] Ensure all imports are updated within the new files
- [ ] Task: Verify split correctness
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
  - [ ] Run `npm test` — all existing tests must pass
  - [ ] Verify no import paths changed for external consumers
- [ ] Task: Commit card-detail split
  - [ ] `git add` the new directory and modified files
  - [ ] Commit with message `refactor(cards): split card-detail.tsx into co-located sub-components`
- [ ] Task: Conductor - User Manual Verification 'Split card-detail.tsx' (Protocol in workflow.md)

## Phase 3: Split `src/lib/data/cards/index.ts`

- [ ] Task: Analyze cards data layer dependencies and exports
  - [ ] Review `src/lib/data/cards/index.ts` for queries, mutations, schemas, helpers
  - [ ] Identify all external consumers of the module
  - [ ] Determine logical module boundaries
- [ ] Task: Split into focused modules
  - [ ] Extract queries into a dedicated file (e.g., `queries.ts`)
  - [ ] Extract mutations into a dedicated file (e.g., `mutations.ts`)
  - [ ] Extract schemas/types into a dedicated file (e.g., `schemas.ts`)
  - [ ] Extract helpers/utilities if applicable (e.g., `helpers.ts`)
  - [ ] Update barrel `index.ts` to re-export the public API unchanged
- [ ] Task: Verify split correctness
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
  - [ ] Run `npm test` — all existing tests must pass
  - [ ] Verify no import paths changed for external consumers
- [ ] Task: Commit cards data split
  - [ ] `git add` the new files and modified `index.ts`
  - [ ] Commit with message `refactor(data): split cards data layer into focused modules`
- [ ] Task: Conductor - User Manual Verification 'Split cards data layer' (Protocol in workflow.md)

## Phase 4: Split `src/lib/data/checklists/`

- [ ] Task: Analyze checklists data layer and plan split
  - [ ] Review existing files in `src/lib/data/checklists/`
  - [ ] Identify queries, mutations, schemas, and helpers
- [ ] Task: Split into focused modules
  - [ ] Extract into `queries.ts`, `mutations.ts`, `schemas.ts`, `helpers.ts` as applicable
  - [ ] Update barrel `index.ts` to re-export the public API unchanged
- [ ] Task: Verify split correctness
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
  - [ ] Run `npm test` — all existing tests must pass
- [ ] Task: Commit checklists data split
  - [ ] Commit with message `refactor(data): split checklists data layer into focused modules`
- [ ] Task: Conductor - User Manual Verification 'Split checklists data layer' (Protocol in workflow.md)

## Phase 5: Split `src/lib/data/comments/`

- [ ] Task: Analyze comments data layer and plan split
  - [ ] Review existing files in `src/lib/data/comments/`
  - [ ] Identify queries, mutations, schemas, and helpers
- [ ] Task: Split into focused modules
  - [ ] Extract into `queries.ts`, `mutations.ts`, `schemas.ts`, `helpers.ts` as applicable
  - [ ] Update barrel `index.ts` to re-export the public API unchanged
- [ ] Task: Verify split correctness
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
  - [ ] Run `npm test` — all existing tests must pass
- [ ] Task: Commit comments data split
  - [ ] Commit with message `refactor(data): split comments data layer into focused modules`
- [ ] Task: Conductor - User Manual Verification 'Split comments data layer' (Protocol in workflow.md)

## Phase 6: Split Discovered Files

- [ ] Task: Split each discovered file >300 lines
  - [ ] For each candidate from Phase 1: analyze, split, verify, and commit individually
  - [ ] Component files: use the co-located directory pattern
  - [ ] Data/utility files: use the concern-based module pattern
- [ ] Task: Verify all splits
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
  - [ ] Run `npm test` — all existing tests must pass
  - [ ] Verify no import paths changed for external consumers
- [ ] Task: Conductor - User Manual Verification 'Discovered Files' (Protocol in workflow.md)

## Phase 7: Final Verification & Cleanup

- [ ] Task: Full test suite verification
  - [ ] Run `npm test` — all tests must pass
  - [ ] Run `npm run typecheck` — must pass
  - [ ] Run `npm run lint` — must pass
- [ ] Task: Build verification
  - [ ] Run `npm run build` — must succeed without errors
- [ ] Task: Manual smoke test
  - [ ] Start the application
  - [ ] Verify card detail page renders correctly
  - [ ] Verify card CRUD operations work
  - [ ] Verify checklist operations work
  - [ ] Verify comment operations work
- [ ] Task: Final scan — no files >300 lines with multiple responsibilities remain
- [ ] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md)
