# Specification: Socket.io Runtime Isolation Fix

## Overview

Fix the critical bug where Socket.io real-time events are not emitted due to runtime isolation between the custom Next.js server and Server Actions. Additionally, refactor the inconsistent state management pattern (window.dispatchEvent) to use Zustand consistently, and add unit tests for the fix.

## Functional Requirements

### 1. Fix Runtime Isolation Bug

- Store the Socket.io server instance on `globalThis` so it's accessible from both the custom server runtime and Server Actions runtime
- Update `setSocketServer()` to assign to `globalThis.__io`
- Update `emitToBoard()` to read from `globalThis.__io`
- Add TypeScript declaration for `globalThis.__io`

### 2. Refactor State Management

- Extend the existing `useBoardCardStore` Zustand store to handle:
  - Checklist updates (currently uses `board:checklist-updated` DOM event)
  - Comment updates (currently uses `board:comment-updated` DOM event)
  - Label updates (currently uses `board:label-updated` DOM event)
  - Label deletions (currently uses `board:label-deleted` DOM event)
  - Card label assignments (currently uses `board:card-labels-updated` DOM event)
- Remove all `window.dispatchEvent` calls from `use-board-socket.ts`
- Remove all `window.addEventListener` calls from `use-card-detail.ts`
- Update components to subscribe to Zustand store changes instead of DOM events

### 3. Add Unit Tests

- Test the `globalThis` singleton pattern:
  - Verify `setSocketServer()` correctly stores the instance
  - Verify `emitToBoard()` correctly reads from `globalThis`
  - Verify `emitToBoard()` handles null/undefined gracefully
- Test the refactored Zustand store actions:
  - Verify checklist update actions
  - Verify comment update actions
  - Verify label update/delete actions
  - Verify card label assignment actions

## Non-Functional Requirements

- **Backward Compatibility:** No breaking changes to the public API
- **Type Safety:** All new code must be fully typed
- **Performance:** No performance regression from the refactor

## Acceptance Criteria

1. Socket.io events are successfully emitted from Server Actions
2. Real-time updates (card moves, list reorders, label changes, etc.) propagate to all connected clients
3. The `window.dispatchEvent` pattern is completely removed
4. All real-time state is managed through the Zustand store
5. Unit tests pass for the `globalThis` singleton pattern
6. Unit tests pass for the refactored Zustand store actions
7. Existing tests continue to pass
8. No TypeScript errors
9. Linting passes

## Out of Scope

- Integration tests or E2E tests for Socket.io
- Multi-instance deployment support (Redis adapter)
- Socket.io authentication/authorization middleware
- Performance optimization of the Socket.io connection
- Changes to the Socket.io event protocol or payload structure
