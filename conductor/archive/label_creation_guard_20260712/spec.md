# Specification: Label creation/edit/delete missing creating-state guard

## Overview

In the card-detail label control (`src/components/cards/card-detail/card-detail-labels.tsx`), the Create, Edit, and Delete label actions have no loading/creating state. A user can spam-click the "Create" button (and the edit/delete triggers), firing multiple `onCreateLabel` / `onUpdateLabel` / `onDeleteLabel` calls to the server in quick succession. This spawns duplicate labels and redundant requests.

This is a bug fix confined to client-side UI behavior. The server is left unchanged.

## Functional Requirements

- **FR-1 (Create guard):** While a label creation request is in flight, the "Create" button MUST be disabled and show a loading spinner. Clicking it must not trigger a second `onCreateLabel` call.
- **FR-2 (Edit guard):** While a label update request (`submitEdit`) is in flight, the Save button MUST be disabled and show a loading spinner, preventing duplicate `onUpdateLabel` calls.
- **FR-3 (Delete guard):** While a label delete request (`confirmDelete`) is in flight, the Delete action MUST be disabled (and the confirmation dialog non-dismissable/loading), preventing duplicate `onDeleteLabel` calls.
- **FR-4 (State reset):** On success or failure of any operation, the creating/submitting state MUST be reset so the control becomes interactive again.
- **FR-5 (Disabled prop):** All guards MUST respect the existing `disabled` prop so that board-level read-only state still suppresses actions.

## Non-Functional Requirements

- **NFR-1 (Accessibility):** The disabled/loading button MUST convey its busy state via `aria-busy` (or equivalent) so screen readers announce the in-progress state.
- **NFR-2 (Performance):** No behavioral change to request payloads or timing; only UI state is added.

## Acceptance Criteria

- AC-1: Spam-clicking "Create" while a request is pending results in exactly one `onCreateLabel` call.
- AC-2: A visible spinner appears on the in-flight Create/Edit button and the Delete action is blocked during delete.
- AC-3: After the request resolves (success or error), the control returns to a usable state with no spinner.
- AC-4: When `disabled` is true (read-only board), no action fires regardless of guard state.
- AC-5: Existing tests in `card-detail.test.tsx` continue to pass; new tests cover the guard for create/edit/delete.

## Out of Scope

- Server-side idempotency / dedupe of label creation (explicitly deferred).
- Changes to label data model, board CRUD, or real-time socket label events.
- New label features (color palette, search already exist).
