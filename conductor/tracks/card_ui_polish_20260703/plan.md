# Implementation Plan: Card UI Polish

## Phase 1: Cursor Visibility on Card Hover

- [ ] Task: Fix cursor invisibility on card hover
  - [ ] Write test asserting cursor styles are visible on card elements
  - [ ] Implement fix for cursor invisibility (remove/modify touch-none or conflicting cursor styles)
  - [ ] Verify `npm test -- src/components/cards/__tests__/card-item.test.tsx`
  - [ ] Commit fix
- [ ] Task: Conductor - User Manual Verification 'Cursor Visibility' (Protocol in workflow.md)

## Phase 2: Animated Card Repositioning During Drag

- [ ] Task: Fix drag animation (other cards stay static during drag)
  - [ ] Write test asserting SortableCardItem applies transform/transition during drag
  - [ ] Implement fix for animated repositioning (apply CSS.Transform.toString, configure measuring)
  - [ ] Verify `npm test -- src/components/cards/__tests__/board-cards-dnd.test.tsx`
  - [ ] Commit fix
- [ ] Task: Conductor - User Manual Verification 'Drag Animation' (Protocol in workflow.md)

## Phase 3: Due Date UI Reflection

- [ ] Task: Fix due date not reflecting on UI after save
  - [ ] Write test asserting card re-renders with new dueDate after store update
  - [ ] Implement fix for reactive due date display (ensure store.updateCard or component subscription fires)
  - [ ] Verify `npm test -- src/components/cards/__tests__/card-item.test.tsx`
  - [ ] Commit fix
- [ ] Task: Conductor - User Manual Verification 'Due Date UI' (Protocol in workflow.md)
