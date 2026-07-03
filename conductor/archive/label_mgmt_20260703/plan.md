# Implementation Plan: Enhanced Label Management

## Phase 1: Backend Data Layer & Server Actions

- [ ] Task: Write tests for label update and delete data layer operations
  - [ ] Test `updateLabel` successfully modifies name and color for an owned label
  - [ ] Test `updateLabel` rejects when label does not exist or board is not owned
  - [ ] Test `deleteLabel` successfully removes a label and cascades to `card_labels`
  - [ ] Test `deleteLabel` rejects when label does not exist or board is not owned
  - [ ] Test `getLabelById` returns a single label by ID
- [ ] Task: Implement `updateLabel` and `deleteLabel` in data layer
  - [ ] Add `updateLabel` function with board ownership verification
  - [ ] Add `deleteLabel` function with board ownership verification
  - [ ] Add `getLabelById` helper for lookups
  - [ ] Verify all data layer tests pass
  - [ ] Commit the change
- [ ] Task: Write tests for label update and delete Server Actions
  - [ ] Test `updateLabelAction` validates input with Zod schema and calls data layer
  - [ ] Test `updateLabelAction` returns formatted errors on failure
  - [ ] Test `deleteLabelAction` validates input and calls data layer
  - [ ] Test `deleteLabelAction` returns formatted errors on failure
- [ ] Task: Implement `updateLabelAction` and `deleteLabelAction`
  - [ ] Create `updateLabelSchema` in `src/lib/schemas/label.ts`
  - [ ] Create `deleteLabelSchema` in `src/lib/schemas/label.ts`
  - [ ] Implement `updateLabelAction` with session verification, revalidation, and error handling
  - [ ] Implement `deleteLabelAction` with session verification, revalidation, and error handling
  - [ ] Verify all Server Action tests pass
  - [ ] Commit the change
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Real-Time Synchronization

- [ ] Task: Write tests for Socket.io label events
  - [ ] Test `label:updated` event broadcasts updated label to all board room clients
  - [ ] Test `label:deleted` event broadcasts deleted label ID to all board room clients
  - [ ] Test `card:labelsUpdated` event broadcasts card label changes to all board room clients
- [ ] Task: Implement Socket.io label events on the server
  - [ ] Add `label:updated` handler emitting to the board room
  - [ ] Add `label:deleted` handler emitting to the board room
  - [ ] Add `card:labelsUpdated` handler emitting to the board room
  - [ ] Verify Socket.io tests pass
  - [ ] Commit the change
- [ ] Task: Write tests for client-side Socket.io label event handlers
  - [ ] Test incoming `label:updated` merges updated label into local board state
  - [ ] Test incoming `label:deleted` removes label from all cards in local state
  - [ ] Test incoming `card:labelsUpdated` updates the target card's label list
- [ ] Task: Implement client-side Socket.io label event handlers
  - [ ] Wire up `label:updated` listener in the board page/store
  - [ ] Wire up `label:deleted` listener in the board page/store
  - [ ] Wire up `card:labelsUpdated` listener in the board page/store
  - [ ] Verify client-side tests pass
  - [ ] Commit the change
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Frontend UI Components & Accessibility

- [ ] Task: Write tests for enhanced label chip component
  - [ ] Test label chip renders with correct height, rounded (pill) shape, and name text
  - [ ] Test label chip is keyboard-focusable and actionable
- [ ] Task: Implement enhanced label chip styling
  - [ ] Increase vertical padding / height on label chips
  - [ ] Apply fully rounded (pill) corners to label chips
  - [ ] Ensure label name is displayed directly on the badge
  - [ ] Update all usages of label chips across the application
  - [ ] Verify component tests pass
  - [ ] Commit the change
- [ ] Task: Write tests for label edit interface
  - [ ] Test clicking an existing label opens an inline edit popover
  - [ ] Test name input updates and saves correctly
  - [ ] Test fixed color palette picker renders predefined swatches
  - [ ] Test selecting a palette color updates the preview and saves
  - [ ] Test "Save" and "Cancel" actions behave correctly
  - [ ] Test keyboard navigation (Tab, Enter, Escape) through the edit interface
- [ ] Task: Implement label edit interface
  - [ ] Add inline edit popover/trigger to existing label chips in `card-detail-labels.tsx`
  - [ ] Build reusable `LabelColorPicker` component with fixed palette
  - [ ] Wire `updateLabelAction` into the edit interface
  - [ ] Handle optimistic UI updates and server reconciliation
  - [ ] Verify tests pass
  - [ ] Commit the change
- [ ] Task: Write tests for label delete flow
  - [ ] Test delete button appears on label edit interface
  - [ ] Test confirmation dialog prevents accidental deletion
  - [ ] Test confirming deletion removes label from UI and calls `deleteLabelAction`
- [ ] Task: Implement label delete flow
  - [ ] Add delete trigger to label edit interface
  - [ ] Implement confirmation dialog using existing dialog/modal primitives
  - [ ] Wire `deleteLabelAction` with optimistic removal and server reconciliation
  - [ ] Verify tests pass
  - [ ] Commit the change
- [ ] Task: Write tests for label filter/search in card detail sidebar
  - [ ] Test search input filters the available label list dynamically
  - [ ] Test empty search state displays a "No matching labels" message
  - [ ] Test keyboard navigation within the filtered list
- [ ] Task: Implement label filter/search
  - [ ] Add search input to the label management popover in `card-detail-labels.tsx`
  - [ ] Implement real-time filtering logic
  - [ ] Ensure screen reader announces result count changes
  - [ ] Verify tests pass
  - [ ] Commit the change
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Integration, E2E & Final Verification

- [ ] Task: Write E2E tests for complete label management flows
  - [ ] E2E: Edit a label name and color from the card detail view
  - [ ] E2E: Delete a label and verify it disappears from all cards
  - [ ] E2E: Assign and unassign labels to a card
  - [ ] E2E: Search/filter labels in the card detail sidebar
  - [ ] E2E: Verify real-time label changes across two browser sessions
- [ ] Task: Implement and run E2E tests
  - [ ] Add E2E specs to `e2e/labels.spec.ts` or equivalent
  - [ ] Run E2E suite and fix any failures
  - [ ] Commit the change
- [ ] Task: Final integration verification
  - [ ] Run full test suite (`npm test`) and ensure 80%+ coverage
  - [ ] Run typecheck (`npm run typecheck`) and fix errors
  - [ ] Run lint (`npm run lint`) and fix issues
  - [ ] Perform manual verification of all label flows in the running application
  - [ ] Commit the change
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)
