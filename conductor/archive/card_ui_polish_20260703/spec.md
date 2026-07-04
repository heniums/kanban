# Specification: Card UI Polish (Cursor, Drag Animation, Due Date)

## Overview

This track addresses three UI polish issues in the kanban card experience:

1. Cursor is invisible when hovering over cards in the list view
2. Dragging a card does not animate other cards out of the way — they remain static until drop
3. Due date selection saves correctly but does not reflect in the UI until a page refresh

## Functional Requirements

### FR1: Cursor Visibility on Card Hover

- The mouse cursor shall be visible when hovering over any card in the list view
- The card shall still display the grab/grabbing cursor during drag operations
- Cards shall remain clickable and draggable

### FR2: Animated Card Repositioning During Drag

- When a card is being dragged, other cards in the drop target list shall smoothly animate out of the way to show the insertion point
- Cards shall use CSS transitions (transform + transition) provided by `@dnd-kit/sortable`'s `useSortable` hook
- The animation shall be smooth (no visual jank or jumping)
- When a card is dropped and the drag ends, all cards shall transition to their final positions

### FR3: Due Date UI Reflection

- When a due date is set or changed via the card detail modal, the card in the list view shall immediately show the updated due date without requiring a page refresh
- The due date badge on the card (with color coding: overdue, due soon, normal) shall update reactively

## Non-Functional Requirements

- No regressions in existing drag-and-drop behavior, card rendering, or due date functionality
- All existing tests must continue to pass

## Acceptance Criteria

1. **AC1:** Hovering a card in the list view shows a visible cursor (not hidden/invisible)
2. **AC2:** Dragging a card within a list causes adjacent cards to smoothly slide apart, revealing the drop position in real-time
3. **AC3:** Setting/changing a due date on a card via the detail modal immediately updates the due date badge on the card in the list view

## Out of Scope

- Drag animation improvements for list reordering (horizontal list drag)
- Due date UI improvements beyond reactive display (e.g., new date picker styling)
- Any changes to drag collision detection (already addressed separately)
