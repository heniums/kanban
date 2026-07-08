# Track: card_dnd_fix_20260708

## Overview

**Type:** Bug Fix
**Description:** Fix card drag-and-drop (`moveCard`) unique constraint violations that cause every card reorder and cross-list move to fail when any list contains cards.

## Problem Statement

The `cards` table defines a unique constraint `cards_list_id_position_unique` on `(list_id, position)`.

The `moveCard` function (`src/lib/data/cards/mutations.ts`) recompacts card positions using single-pass `UPDATE` queries:

- **Within-list:** `UPDATE cards SET position = position + 1 …` or `position - 1 …`
- **Cross-list:** `UPDATE cards SET position = position + 1 …` in the target list

These queries temporarily create duplicate `(list_id, position)` values because the card being moved still holds its original position while neighboring cards are shifted. PostgreSQL enforces the unique constraint per-row during the `UPDATE`, so the statement aborts with `23505 duplicate key value violates unique constraint`.

### Reproduction

1. Create a board with two lists.
2. Add at least one card to each list.
3. Drag a card within its list to a different position **→ fails**.
4. Drag a card from one list to the other **→ fails**.
5. Drag a card to an empty list **→ works** (no rows are shifted in the target list).

### Observed Error

```
Failed query: UPDATE cards SET position = position - 1
WHERE list_id = $1 AND position > $2
params: <list-id>, 0

duplicate key value violates unique constraint "cards_list_id_position_unique"
```

## Functional Requirements

1. **Within-list reorder** must succeed for any valid target position without violating the unique constraint.
2. **Cross-list move** must succeed for both empty and non-empty target lists.
3. **Position integrity** must be preserved: after any move, cards in each affected list must occupy contiguous positions `0 … n-1` with no gaps or duplicates.
4. **Atomicity** must be preserved: all position updates happen inside the existing `db.transaction` block.

## Non-Functional Requirements

- No changes to the database schema (the unique constraint is correct and should remain).
- No UI or API contract changes; `moveCard` signature stays the same.
- Performance: the fix should not materially increase query count (acceptable to use a two-pass update for affected cards).

## Acceptance Criteria

- [ ] A user can drag a card to reorder it within its list and the change persists after refresh.
- [ ] A user can drag a card to another list (empty or populated) and the change persists after refresh.
- [ ] Source and target lists maintain gap-free, zero-based positions after every move.
- [ ] Existing integration test `moveCard (integration)` continues to pass.
- [ ] New integration tests cover:
  - Moving a card down within the same list.
  - Moving a card up within the same list.
  - Moving a card to position 0 in a non-empty target list.
- [ ] `npm test`, `npm run typecheck`, and `npm run lint` all pass.

## Out of Scope

- List reordering logic (already handled correctly by `reorderLists`).
- Card creation / deletion position logic (not affected by this bug).
- UI/UX improvements to drag-and-drop visuals, animations, or cursor styles.
