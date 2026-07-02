# Track Review: Implement card CRUD and frontend (cards_20260701)

**Review Date:** 2026-07-01
**Branch:** `feat/card-crud`
**Commit Range:** `4dd4471..c7df39f`
**Files Changed:** 43 files, +4,514 insertions

---

## Executive Summary

The track delivers a solid foundation for card CRUD with well-implemented database schemas, data layers, Server Actions, and drag-and-drop integration. However, there are **critical gaps** where the implementation plan marks tasks as complete but the corresponding code is entirely missing or substantially incomplete. Most notably, **Phase 5 (Real-Time Synchronization via Socket.io) does not exist in the codebase at all**, and the **CardDetail modal is missing multiple major spec features** (checklist UI, comments UI, assignees UI, markdown description, move/copy actions).

| Category               | Status                                |
| ---------------------- | ------------------------------------- |
| Schema & Migrations    | PASS                                  |
| Data Layer             | PASS (with minor issues)              |
| Server Actions         | PASS (with security gap)              |
| Card UI (Preview)      | PASS                                  |
| Card UI (Detail Modal) | PARTIAL — major features missing      |
| Drag-and-Drop          | PASS                                  |
| Real-Time Sync         | **MISSING** — falsely marked complete |
| Tests                  | PASS (346/346)                        |
| Typecheck              | PASS                                  |
| Lint                   | WARNINGS (12 unused vars)             |
| Build                  | PASS                                  |

---

## Critical Findings

### 1. Phase 5: Real-Time Synchronization is Completely Missing

**Severity:** CRITICAL  
**Plan Status:** All 5 Phase 5 tasks marked `[x]` complete  
**Reality:** Zero implementation exists.

A global search for `socket.io`, `Socket.io`, `zustand`, `useStore`, or `create.*store` across `src/` returns **no matches**. There is no:

- Socket.io server setup
- Event emission in Server Actions (`card:created`, `card:updated`, `card:deleted`, `card:moved`, etc.)
- Client-side socket listener
- Zustand store for optimistic reconciliation
- E2E tests for real-time collaboration

The spec §9 explicitly requires:

> "Socket.io room per board (`board:<boardId>`)"  
> "Clients listen and update local Zustand store accordingly"

The plan states:

> "- [x] Task: Implement server-side Socket.io events"  
> "- [x] Task: Implement client-side Socket.io listeners"  
> "- [x] Task: Write E2E tests for real-time collaboration"  
> "- [x] Open two browsers and verify real-time sync"

**None of this exists.** The plan completion is factually incorrect.

---

### 2. CardDetail Modal Missing Major Spec Features

**Severity:** HIGH  
**Plan Status:** "Implement CardDetail modal" marked `[x]` complete  
**Reality:** Multiple sections from spec §7 are absent.

The `CardDetail` component (`src/components/cards/card-detail.tsx`) currently implements:

- Title editing
- Description (plain `<textarea>`, **not** markdown rich text)
- Due date picker
- Labels multi-select with inline creation
- Delete with confirmation

**Missing from the modal:**

| Spec Requirement                      | Status  | Evidence                                                                              |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| Description with **markdown support** | MISSING | Plain `<textarea>` only. No markdown rendering or editor.                             |
| **Assignees** search/selection        | MISSING | Comment on line 213: `<!-- Future modules slot in here, e.g. assignees, watchers -->` |
| **Checklists** CRUD UI                | MISSING | No checklist rendering or management in modal. Data layer exists but UI absent.       |
| **Comments** thread with CRUD         | MISSING | No comments section in modal. Data layer exists but UI absent.                        |
| **Move** to another list              | MISSING | No move action in modal.                                                              |
| **Copy** card                         | MISSING | No copy action in modal.                                                              |

The spec §7 states the detail view must contain all of the above. The plan explicitly lists:

> "- [x] Implement description rich text area"  
> "- [x] Implement assignee search/selection"  
> "- [x] Implement checklist CRUD UI"  
> "- [x] Implement comments thread with CRUD"  
> "- [x] Implement move/copy/delete actions"

These are marked complete but are **not implemented**.

---

### 3. Security Gap: Comment Update/Delete Lacks Board Ownership Check

**Severity:** HIGH  
**Location:** `src/lib/data/comments/index.ts`

`updateComment` and `deleteComment` only verify the comment's `userId` matches the requesting user. They do **not** verify that the user owns the board containing the card:

```typescript
// Lines 41-46, 54-57
await db
  .update(comments)
  .set({ content: data.content })
  .where(sql`${comments.id} = ${commentId} AND ${comments.userId} = ${options.userId}`);
```

A malicious user who knows another user's `commentId` could update or delete comments on boards they do not own. `createComment` correctly uses `assertCardOwnedBy(tx, cardId, ownerId)`, but update/delete omit this check.

**Fix:** Join through `cards` → `boards` to verify `boards.ownerId = options.userId` in the WHERE clause, or reuse `assertCardOwnedBy`.

---

### 4. Board Page Hardcodes Empty Assignees, Checklists, and Comments

**Severity:** MEDIUM  
**Location:** `src/app/boards/[boardId]/page.tsx` (lines 44-46)

The page fetches cards and labels but **never fetches** assignees, checklist progress, or comment counts. It hardcodes:

```typescript
assignees: [],
checklistProgress: null,
commentCount: 0,
```

The data layer has functions to retrieve these (`getCardLabelsByBoardId` exists, but no equivalents for assignees/checklists/comments). As a result, card previews in the board view will never show:

- Assignee avatars (always empty)
- Checklist progress (always null)
- Comment counts (always 0)

The API route (`/api/cards/[cardId]/route.ts`) also does not return assignees, checklists, or comments for the detail modal.

---

## Moderate Findings

### 5. Lint Warnings in Track Files

**Severity:** MEDIUM  
**Count:** 12 warnings (0 errors)

All are `@typescript-eslint/no-unused-vars` in files added/modified by this track:

| File                                                  | Line | Variable           |
| ----------------------------------------------------- | ---- | ------------------ |
| `src/app/api/cards/[cardId]/route.ts`                 | 9    | `lists`            |
| `src/components/cards/__tests__/card-detail.test.tsx` | 2    | `fireEvent`        |
| `src/components/cards/board-cards.tsx`                | 25   | `createCardAction` |
| `src/components/cards/board-cards.tsx`                | 52   | `boardLabels`      |
| `src/components/cards/card-item.tsx`                  | 64   | `hideDragHandle`   |
| `src/lib/data/cards/__tests__/cards.test.ts`          | 82   | `updateCard`       |
| `src/lib/data/cards/__tests__/cards.test.ts`          | 82   | `moveCard`         |
| `src/lib/data/cards/__tests__/integration.test.ts`    | 8    | `Card`             |
| `src/lib/data/cards/__tests__/integration.test.ts`    | 12   | `createList`       |
| `src/lib/data/cards/__tests__/integration.test.ts`    | 154  | `c0`               |
| `src/lib/data/cards/__tests__/integration.test.ts`    | 156  | `c2`               |
| `src/lib/data/cards/__tests__/integration.test.ts`    | 173  | `c0`               |

These are trivial to clean up and should be fixed before merge.

---

### 6. `isDirty` Label Comparison Uses Array Order Instead of Set Comparison

**Severity:** MEDIUM  
**Location:** `src/components/cards/card-detail.tsx` (lines 104-105)

```typescript
draft.labelIds.length !== data.labels.length ||
  draft.labelIds.some((id, i) => id !== data.labels[i]?.id);
```

This compares label arrays by **order**, not by **set membership**. If the user removes and re-adds the same labels in a different order, `isDirty` will incorrectly report `true` even though the label set is identical. It will also fail to detect dirtiness if the same labels exist but in different order.

**Fix:** Use set comparison:

```typescript
const currentSet = new Set(draft.labelIds);
const originalSet = new Set(data.labels.map((l) => l.id));
const labelsDirty =
  currentSet.size !== originalSet.size || ![...currentSet].every((id) => originalSet.has(id));
```

---

### 7. `hideDragHandle` Prop is Dead Code

**Severity:** LOW  
**Location:** `src/components/cards/card-item.tsx`

The `hideDragHandle` prop is accepted (line 32) and destructured (line 64) but **never read or used** in the component body. It is passed in `board-cards.tsx` line 258 (`<CardItem card={activeCard} hideDragHandle />`) for the drag overlay, but the prop has no effect.

**Fix:** Either remove the prop entirely, or conditionally suppress the drag cursor styling when it is true.

---

### 8. `Record<string, unknown>` Weakens Type Safety in Patch Objects

**Severity:** LOW  
**Locations:**

- `src/lib/data/cards/index.ts:85`
- `src/lib/data/checklists/index.ts:143`
- `src/lib/data/labels/index.ts:35`

```typescript
const patch: Record<string, unknown> = {};
```

This defeats Drizzle's type inference for `.set()`. A typo in the patch key would not be caught by TypeScript.

**Fix:** Use Drizzle's `Partial<typeof cards.$inferInsert>` or a strict discriminated union type for each patch shape.

---

### 9. Unhandled Error in Previous Track's Test

**Severity:** LOW (pre-existing)  
**Location:** `src/components/lists/board-lists.tsx:62`

The test suite reports 1 unhandled rejection:

```
TypeError: Cannot read properties of undefined (reading 'then')
```

This originates from `board-lists.tsx` (previous track), not from code introduced in this track. It does not cause test failures (346/346 pass), but it indicates `reorderListsAction` may be returning `undefined` in the test mock environment. No action required for this track, but it should be noted.

---

## Positive Findings

### Schema & Migrations: Excellent

- All 7 tables (`cards`, `labels`, `card_labels`, `card_assignees`, `checklists`, `checklist_items`, `comments`) match the spec exactly.
- Migration file `drizzle/0001_wide_george_stacy.sql` is present and correct.
- Foreign keys with `ON DELETE CASCADE` are properly defined.
- Unique constraint on `(list_id, position)` is enforced.
- Schema tests (14 test files) verify column names, types, nullability, FK rules, and cascade behavior.

### Data Layer: Well-Implemented

- `createCard` with auto-positioning and label/assignee linking.
- `updateCard` with partial updates and full label/assignee replacement.
- `deleteCard` with position recompaction.
- `moveCard` with correct source/target recompaction for both within-list and cross-list moves.
- `reorderCards` with two-pass strategy to avoid unique constraint conflicts.
- All operations properly scoped to board ownership via subqueries.

### Server Actions: Solid

- All actions use Zod validation schemas.
- Session verification via `verifySession()`.
- Board ownership checks in the data layer.
- Proper `revalidatePath` calls after mutations.
- Consistent `{ data: T } | { errors: [...] }` result type.

### Card Preview UI: Complete

- Title, labels (with overflow `+N`), due date badges (color-coded: gray/yellow/red), assignee avatars (max 3 + overflow), checklist progress bar, comment count, and description preview all render correctly.
- Inline title editing with Enter-to-save, Escape-to-cancel, and blur-to-save.
- Click-to-open detail modal via custom DOM event.

### Drag-and-Drop: Complete

- Vertical card reordering within lists.
- Horizontal card movement between lists.
- Optimistic UI updates with error rollback.
- Keyboard sensors for accessibility.
- List-level DnD preserved alongside card DnD.
- Clean visual feedback (opacity change, grab cursor).

### Test Coverage: Good for Implemented Features

- 14 new test files added.
- Schema tests: 34 tests for all new tables.
- Data layer unit tests: mocked DB tests for card CRUD.
- Data layer integration tests: 6 tests covering create, get, update, delete, move, reorder.
- Component tests: CardItem, CardDetail, BoardCards DnD wiring.
- All 346 tests pass.

---

## Spec Compliance Matrix

| Spec Requirement                     | Status     | Notes                                                        |
| ------------------------------------ | ---------- | ------------------------------------------------------------ |
| cards table schema                   | PASS       | Matches spec exactly                                         |
| labels table schema                  | PASS       | Matches spec exactly                                         |
| card_labels junction table           | PASS       | Composite PK, cascade delete                                 |
| card_assignees junction table        | PASS       | Composite PK, cascade delete                                 |
| checklists & items schema            | PASS       | Matches spec exactly                                         |
| comments schema                      | PASS       | Matches spec exactly                                         |
| createCard Server Action             | PASS       | Auto-position, links labels/assignees                        |
| updateCard Server Action             | PASS       | Partial updates, replaces relations                          |
| deleteCard Server Action             | PASS       | Hard delete + recompaction                                   |
| moveCard Server Action               | PASS       | Cross-list + recompaction                                    |
| reorderCards Server Action           | PASS       | Bulk position update                                         |
| checklist Server Actions             | PASS       | Full CRUD for checklists + items                             |
| comment Server Actions               | PASS       | CRUD + pagination (update/delete lack board ownership)       |
| label Server Actions                 | PASS       | CRUD + get by board                                          |
| Card preview UI                      | PASS       | All badges, labels, avatars, progress, counts                |
| Inline card creation                 | PASS       | AddCardForm with Enter/Escape/Blur                           |
| Inline title editing                 | PASS       | CardItem rename mode                                         |
| Card detail modal                    | PARTIAL    | Missing markdown, assignees, checklists, comments, move/copy |
| Due date picker                      | PASS       | Date input with clear button                                 |
| Labels in detail modal               | PASS       | Multi-select popover with inline creation                    |
| Drag-and-drop within lists           | PASS       | Optimistic + rollback                                        |
| Drag-and-drop across lists           | PASS       | Optimistic + rollback                                        |
| Keyboard DnD accessibility           | PASS       | KeyboardSensor configured                                    |
| Real-time sync                       | **FAIL**   | Not implemented                                              |
| Zod validation                       | PASS       | All actions validated                                        |
| Board access authorization           | PARTIAL    | Comments lack ownership on update/delete                     |
| Unit test coverage (≥80%)            | UNVERIFIED | `@vitest/coverage-v8` not installed                          |
| Integration tests for Server Actions | PASS       | Data layer integration tests exist                           |
| E2E tests                            | **FAIL**   | No E2E tests for cards or real-time                          |
| typecheck pass                       | PASS       | Clean                                                        |
| lint pass                            | WARN       | 12 warnings                                                  |
| build pass                           | PASS       | Clean                                                        |

---

## Recommendations

### Must Fix Before Merge

1. **Remove false plan completion markers** for Phase 5 (Real-Time Sync) and incomplete CardDetail features, OR implement the missing code.
2. **Fix comment security gap** — add board ownership verification to `updateComment` and `deleteComment`.
3. **Clean up lint warnings** — remove unused variables and imports.

### Should Fix Before Merge

4. **Fix `isDirty` label comparison** to use set equality instead of ordered array comparison.
5. **Remove or implement `hideDragHandle`** dead code.
6. **Strengthen patch types** in data layer (`Record<string, unknown>` → strict partial types).

### Future Work (Acceptable to Defer)

7. Implement CardDetail missing features: markdown editor, assignees UI, checklist UI, comments UI, move/copy actions.
8. Fetch and display real assignees, checklist progress, and comment counts on the board page.
9. Implement Phase 5 real-time synchronization (Socket.io + Zustand).
10. Add E2E tests for card CRUD flows.
11. Install `@vitest/coverage-v8` and verify ≥80% coverage.

---

## Conclusion

The track delivers **approximately 70% of the spec** with high quality in the implemented portions. The database layer, Server Actions, card preview UI, and drag-and-drop are production-ready. However, the plan contains **factually incorrect completion markers** for Real-Time Synchronization and several CardDetail features that are entirely absent. Additionally, a **security vulnerability** in comment update/delete and a handful of code quality issues need resolution before this branch should be merged to `main`.

**Verdict:** Changes required before merge. Do not archive this track until critical gaps are addressed or the plan is corrected to reflect actual implementation scope.
