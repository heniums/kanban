# Specification: Eliminate Unnecessary Fetch-Before-Write in Data Layer

## Type

Refactor

## Overview

The data layer contains 6 instances where a SELECT query is executed solely to verify a record's existence before performing an INSERT or mutation. These are redundant checks — the database's foreign key constraints already guarantee referential integrity. The SELECTs add an unnecessary round-trip per operation with no safety benefit.

## Scope

Six patterns across 5 files are refactored:

| #   | File                                   | Function                                | What's Removed                                                |
| --- | -------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| 1   | `src/lib/data/lists/create.ts`         | `createList`                            | SELECT boards (ownership check) before INSERT                 |
| 2   | `src/lib/data/labels/index.ts`         | `createLabel`                           | SELECT boards (ownership check) before INSERT                 |
| 3   | `src/lib/data/checklists/mutations.ts` | `assertCardOwnedBy` + `createChecklist` | Guard function SELECT cards+boards before INSERT              |
| 4   | `src/lib/data/comments/mutations.ts`   | `assertCardOwnedBy` + `createComment`   | Guard function SELECT cards+boards before INSERT              |
| 5   | `src/lib/data/checklists/mutations.ts` | `createChecklistItem`                   | SELECT checklists+cards+boards before INSERT                  |
| 6   | `src/lib/data/cards/mutations.ts`      | `updateCard` (else-branch)              | SELECT cards when only labelIds/assigneeIds are being updated |

## Approach

1. **Remove the pre-mutation SELECT.** The INSERT/DELETE/INSERT proceeds directly.
2. **Let the database enforce integrity.** Foreign key constraints on `boardId`, `cardId`, and `checklistId` will reject invalid references with a constraint violation error. No explicit existence check is added in the data layer.
3. **Ownership is enforced upstream.** Server Actions and the DAL (`verifySession`) already scope operations to the authenticated user. The removed SELECTs for ownership on `boards` were redundant with this upstream auth layer.

## Functional Requirements

- FR1: `createList` inserts directly without a board existence SELECT
- FR2: `createLabel` inserts directly without a board existence SELECT
- FR3: `createChecklist` inserts directly without asserting card ownership
- FR4: `createComment` inserts directly without asserting card ownership
- FR5: `createChecklistItem` inserts directly without a parent checklist existence SELECT
- FR6: `updateCard` handles labelIds/assigneeIds changes without a pre-fetch SELECT when no scalar fields are updated
- FR7: All existing tests continue to pass (adjust test expectations if tests previously asserted the thrown error messages)

## Out of Scope

- Functions that fetch before mutation for data-derivation purposes (`createCard`, `moveCard`, `copyCard`, `deleteChecklist`, `deleteChecklistItem`) — those SELECTs retrieve data needed for the mutation logic and are not purely existence checks.

## Acceptance Criteria

1. No SELECT-before-INSERT pattern remains in the 6 identified call sites
2. All existing unit tests pass (`npm test`)
3. Type checking passes (`npm run typecheck`)
4. Linting passes (`npm run lint`)
