# Implementation Plan: Label action creating-state guard

> Methodology: TDD (write tests first, verify fail, implement, verify pass). Each task: write tests → implement → verify → commit.

## Phase 1: Test coverage for label action guards (RED)

- [ ] Task: Add tests asserting single-call + disabled/spinner behavior for create, edit, and delete under repeated clicks
  - [ ] Write a test that spam-clicks "Create" and asserts exactly one `onCreateLabel` call and `aria-busy` becomes true during the request (in `card-detail.test.tsx` / `card-detail-labels` tests)
  - [ ] Write a test that spam-clicks Save during edit and asserts a single `onUpdateLabel` call
  - [ ] Write a test that spam-clicks Delete and asserts a single `onDeleteLabel` call
- [ ] Task: Run the new tests and confirm they FAIL (RED)
- [ ] Task: Commit the failing tests
  - [ ] `git commit -m "test(cards): add failing tests for label create/edit/delete spam guard"`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Test coverage for label action guards (RED)' (Protocol in workflow.md)

## Phase 2: Implement creating-state guards (GREEN)

- [ ] Task: Add `isCreating`, `isUpdating`, `isDeleting` state and gate all submit handlers
  - [ ] Add `isCreating` state; disable + show spinner on Create button while `onCreateLabel` is in flight; reset on resolve/reject; respect `disabled` prop
  - [ ] Add `isUpdating` state; disable + spinner on Save button during `submitEdit`; reset on resolve/reject
  - [ ] Add `isDeleting` state; disable Delete action / block dialog during `confirmDelete`; reset on resolve/reject
  - [ ] Set `aria-busy` on in-flight buttons for screen-reader announcement (NFR-1)
- [ ] Task: Run tests and confirm they PASS (GREEN)
- [ ] Task: Run `npm run lint` and `npm run typecheck`
- [ ] Task: Commit the implementation
  - [ ] `git commit -m "fix(cards): guard label create/edit/delete against spam-click duplicate requests"`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Implement creating-state guards (GREEN)' (Protocol in workflow.md)

## Phase 3: Verification & regression

- [ ] Task: Run full test suite (`npm test`) to confirm no regressions in `card-detail.test.tsx`
- [ ] Task: Manually verify in browser: spam-click Create/Edit/Delete shows spinner and fires a single request each
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Verification & regression' (Protocol in workflow.md)
