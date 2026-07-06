# Implementation Plan: Card Detail Assignees Lists All Users

## Phase 1: Audit for Similar Unscoped User Queries

- [ ] Task: Audit API routes
  - [ ] Search `/src/app/api/` for queries that select from `users` without board/context scope
  - [ ] Search `/src/app/` Server Actions for unscoped user queries
- [ ] Task: Audit data layer
  - [ ] Search `/src/lib/data/` for unscoped user queries
- [ ] Task: Document findings
  - [ ] List all locations where users are queried without proper scope
  - [ ] Determine which require fixes beyond the primary card detail bug
- [ ] Task: Conductor - User Manual Verification 'Audit for Similar Unscoped User Queries' (Protocol in workflow.md)

## Phase 2: Fix Card Detail API Route (Primary)

- [ ] Task: Write unit tests for scoped board members query
  - [ ] Write test verifying that the scoped query returns only board members for a given boardId
  - [ ] Write test verifying that non-members are excluded
  - [ ] Write test verifying the card detail API response includes correctly scoped boardMembers
- [ ] Task: Implement scoped query in card detail API route
  - [ ] In `/src/app/api/cards/[cardId]/route.ts`, replace the unscoped `SELECT FROM users` with a join through `board_members` filtered by `card.boardId`
  - [ ] Ensure the query selects `id`, `name`, `email` matching the existing shape
- [ ] Task: Verify tests pass
  - [ ] Run `npm test` and confirm all tests pass
- [ ] Task: Run quality checks
  - [ ] Run `npm run typecheck`
  - [ ] Run `npm run lint`
- [ ] Task: Conductor - User Manual Verification 'Fix Card Detail API Route' (Protocol in workflow.md)

## Phase 3: Fix Secondary Bugs from Audit (if any)

- [ ] Task: Address each audited location
  - [ ] For each location: write unit test, implement scoped query, verify
- [ ] Task: Run quality checks against all changes
  - [ ] Run `npm test`
  - [ ] Run `npm run typecheck`
  - [ ] Run `npm run lint`
- [ ] Task: Conductor - User Manual Verification 'Fix Secondary Bugs' (Protocol in workflow.md)
