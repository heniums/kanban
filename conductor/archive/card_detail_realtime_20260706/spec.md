# Specification: Card Detail Modal Real-Time Updates

## Overview

Fix the card detail modal to receive real-time updates when another user updates the same card. Currently, updates to title, description, due date, labels, and assignees are only reflected in the board view, not in open card detail modals. Additionally, remove the dead `CARD_LABELS_UPDATED` event code (never emitted) and add comprehensive tests.

## Functional Requirements

### 1. Card Detail Modal Real-Time Updates

- Subscribe to `CARD_UPDATED` events in `use-card-detail.ts`
- When `CARD_UPDATED` arrives for the currently open card, update the modal state directly from the payload
- Update all relevant fields: title, description, due date, labels, assignees
- Preserve draft state if user has unsaved changes (don't overwrite dirty fields)
- Update checklist progress and comment count from payload

### 2. Remove Dead Code

- Remove `CARD_LABELS_UPDATED` event type from `types.ts`
- Remove `CARD_LABELS_UPDATED` listener from `use-board-socket.ts`
- Remove `cardLabelsUpdatedEvent` from Zustand store (`board-store.ts`)
- Remove all related tests and subscriptions

### 3. Add Comprehensive Tests

- Test card detail modal subscription to `CARD_UPDATED` events
- Test that dirty draft fields are preserved when remote update arrives
- Test that clean fields are updated from payload
- Test removal of `CARD_LABELS_UPDATED` code (verify no references remain)

## Non-Functional Requirements

- **Backward Compatibility:** No breaking changes to the public API
- **Type Safety:** All new code must be fully typed
- **Performance:** Direct payload update is faster than re-fetching from API

## Acceptance Criteria

1. Card detail modal updates when another user changes title, description, due date, labels, or assignees
2. User's unsaved draft changes are preserved (not overwritten by remote updates)
3. `CARD_LABELS_UPDATED` code is completely removed
4. Unit tests pass for the new subscription logic
5. Existing tests continue to pass
6. No TypeScript errors
7. Linting passes

## Out of Scope

- Multi-instance deployment support (Redis adapter)
- Socket.io authentication/authorization middleware
- E2E tests for real-time updates
- Changes to the Socket.io event protocol or payload structure
