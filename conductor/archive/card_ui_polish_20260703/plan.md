# Implementation Plan: Card UI Polish

## Phase 1: Cursor Visibility on Card Hover

- [x] Task: Fix cursor invisibility on card hover
  - [x] Write test asserting cursor styles are visible on card elements
  - [x] Implement fix for cursor invisibility (remove/modify touch-none or conflicting cursor styles)
  - [x] Verify `npm test -- src/components/cards/__tests__/card-item.test.tsx`
  - [x] Commit fix
- [x] Task: Conductor - User Manual Verification 'Cursor Visibility' (Protocol in workflow.md)

## Phase 2: Animated Card Repositioning During Drag

- [x] Task: Fix drag animation (other cards stay static during drag)
  - [x] Write test asserting SortableCardItem applies transform/transition during drag
  - [x] Implement fix for animated repositioning (apply CSS.Transform.toString, configure measuring)
  - [x] Verify `npm test -- src/components/cards/__tests__/board-cards-dnd.test.tsx`
  - [x] Commit fix
- [x] Task: Conductor - User Manual Verification 'Drag Animation' (Protocol in workflow.md)

## Phase 3: Due Date UI Reflection

- [x] Task: Fix due date not reflecting on UI after save
  - [x] Write test asserting card re-renders with new dueDate after store update
  - [x] Implement fix for reactive due date display (ensure store.updateCard or component subscription fires)
  - [x] Verify `npm test -- src/components/cards/__tests__/card-item.test.tsx`
  - [x] Commit fix
- [x] Task: Conductor - User Manual Verification 'Due Date UI' (Protocol in workflow.md)
