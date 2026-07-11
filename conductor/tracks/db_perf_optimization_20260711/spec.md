# Track: Database & Data-Loading Performance Optimization

## Overview

The application currently suffers from slow page load and data response times due to systemic issues in the database query and data-access layers. An investigation of every data access file, the database schema, migration history, the connection pool, and page loading paths confirmed multiple performance problems:

1. **Missing database indexes** — Almost no indexes exist beyond primary keys and the single `board_members_user_id_idx`. The most queried foreign-key columns (`cards.board_id`, `comments.card_id`, `labels.board_id`, `checklists.card_id`, `checklist_items.checklist_id`, `boards.owner_id`, `boards.deleted_at`) have no index, causing full table scans on the most frequent user flows (board view, card open, trash page).
2. **N+1 query patterns in mutations** — `moveCard`, `reorderCards`, `reorderLists`, and `deleteList` issue sequential per-item UPDATEs or SELECTs inside loops, generating up to `6 + 4N` round trips per operation.
3. **Redundant fetches after writes** — `updateCardAction` re-runs 5 queries to rebuild a `CardSummary`; checklist and comment actions each do a redundant `boardId` lookup after mutations.
4. **NextAuth `jwt` callback runs a DB query on every request** — `auth.ts:51-56` calls `getUserById(token.sub)` on every token resolution, adding a guaranteed extra round trip to every authenticated page load and server action.
5. **Connection pool under-configured** — `client.ts:42` creates the pool with only a connection string. No `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, or `statement_timeout`. There is no query timing/logging instrumentation to diagnose slow queries.
6. **Sequential awaits on the board page** — `boards/[boardId]/page.tsx` awaits `getBoardById`, then `getBoardCapabilities`, then `getListsByBoardId` sequentially before parallelizing the remaining 6 queries.
7. **Over-fetching** — `getCardsByBoardId` selects `description` (potentially large text) for the board view even though only title/position/dueDate are needed.

This track refactors the data layer to eliminate these inefficiencies and restore responsive page load and interaction times.

## Type

Chore / Refactor (performance)

## Functional Requirements

### FR-1: Database Indexes

The database schema MUST add indexes for all foreign-key columns currently queried without index coverage:

- `cards.board_id` — drives board page card query
- `comments.card_id` — drives card-detail and board aggregation
- `comments.user_id` — used by cascade operations
- `labels.board_id` — drives board label query
- `checklists.card_id` — drives card-detail checklist query
- `checklist_items.checklist_id` — drives checklist-item fetch
- `attachments.created_by` — used by cascade operations
- `boards.owner_id` — drives trash page and dashboard filtering
- `boards.deleted_at` — partial index `WHERE deleted_at IS NOT NULL` for the trash view

A new Drizzle migration MUST be generated and applied. Existing migrations MUST NOT be re-applied or rolled back.

### FR-2: Eliminate N+1 and Sequential-Loop Query Patterns

The following mutations MUST be rewritten to consolidate sequential per-item statements into batched operations:

- **`moveCard`** (`mutations.ts:127-254`) — Replace the six loops of sequential UPDATEs with at most two statements per list: one `UPDATE ... SET position = CASE WHEN id = ? THEN ? ... END WHERE id IN (...)` for negative positions and one for final positions. Total round trips for a move MUST be O(1) per affected list, not O(N).
- **`reorderCards`** (`mutations.ts:256-286`) — Replace the two N-length loops with two single batched `UPDATE ... CASE` statements.
- **`reorderLists`** (`lists/reorder.ts:14-35`) — Same consolidation pattern.
- **`deleteList`** (`lists/delete.ts:17-26`) — Fetch all attachments for the list in a single query; delete DB rows in batched statements; parallelize Cloudinary asset deletions with `Promise.allSettled`.
- **`createCard`, `updateCard`, `copyCard`** — Replace sequential per-label / per-assignee inserts with a single batch `insert(...).values([...])`.

### FR-3: Eliminate Redundant Post-Mutation Fetches

- **`updateCardAction`** (`actions/cards/index.ts:75`) — Construct the realtime `CardSummary` payload from data already available after the update (the returned card row plus the just-written label/assignee arrays) instead of calling `getCardSummaryById(cardId)`, which runs 5 additional queries.
- **Checklist actions** (`actions/checklists/index.ts:117-121,152-157,187-191`) — Return `boardId` from the mutation transaction itself so the post-mutation `revalidateForCard` / inline `SELECT boardId` lookup is removed. (Also correct the apparent `cardId: row.boardId` bug at these sites.)
- **Comment actions** (`actions/comments/index.ts:77,103`) — Same pattern: return `boardId` from the mutation, remove redundant post-mutation lookup.
- **`removeMember`** (`members/remove.ts:8-16`) — Remove the redundant pre-transaction member fetch; reuse the in-transaction fetch.

### FR-4: Optimize NextAuth `jwt` Callback

`auth.ts:51-56` currently calls `getUserById(token.sub)` on every token resolution to refresh `avatarUrl`. This MUST be changed so the DB query does NOT run on every request. Acceptable approaches:

- Only refresh `avatarUrl` on the `update` session trigger (when the user updates their profile) rather than every `jwt` callback invocation.
- Or cache the avatar URL in the token and only re-fetch when the token does not contain it.

Session correctness MUST be preserved — authenticated users must continue to see their current avatar URL.

### FR-5: Configure Connection Pool and Add Query Instrumentation

`src/lib/db/client.ts` MUST be updated to:

- Set pool `max` connections (appropriate for Neon serverless, e.g. 10-15).
- Set `idleTimeoutMillis` and `connectionTimeoutMillis`.
- Set `statement_timeout` to prevent runaway queries.
- Add lightweight query timing/log instrumentation (e.g. log queries slower than a configurable threshold) to aid future diagnosis.

### FR-6: Parallelize Board Page Data Loading

`src/app/boards/[boardId]/page.tsx` MUST batch independent queries into a single `Promise.all` rather than three sequential awaits. Specifically: `getBoardById` (required for `notFound()`), and once authorized, `getBoardCapabilities` + `getListsByBoardId` + the existing 6-query batch should run together with no artificial sequencing.

### FR-7: Avoid Over-Fetching on Board View

`getCardsByBoardId` (`queries.ts:75-83`) MUST select only the columns the board view consumes (id, listId, boardId, title, position, dueDate). The `description` column MUST be deferred to the card-detail fetch.

## Non-Functional Requirements

- **Performance:** Board page query round trips reduced from ~4 sequential + 6 parallel to 1 sequential + 8 parallel (effectively 2 round trips). Mutation round trips reduced from O(N) to O(1) per affected list.
- **Correctness:** No behavioral change to user-facing features. Existing unit, integration, and E2E tests MUST continue to pass.
- **Safety:** Indexes are additive (new migration only). Mutation behavior preserved (same final ordering, same realtime payloads).
- **Observability:** Slow queries above the configured threshold are logged.

## Acceptance Criteria

1. A new migration exists that creates the indexes listed in FR-1 and `npm run db:push` / `drizzle-kit generate` produces no further diff.
2. `moveCard`, `reorderCards`, `reorderLists`, and `deleteList` no longer contain per-item sequential `await` loops; each issues a constant number of statements regardless of list size.
3. `createCard`, `updateCard`, and `copyCard` insert label and assignee associations in a single batched insert.
4. `updateCardAction` no longer calls `getCardSummaryById` after the update; the realtime payload is built from already-fetched data.
5. Checklist and comment actions no longer perform a post-mutation `SELECT boardId` lookup; `boardId` is returned from the mutation. The `cardId: row.boardId` bug is corrected.
6. `removeMember` performs exactly one member fetch (in-transaction).
7. `auth.ts` `jwt` callback no longer issues `getUserById` on every token resolution; `avatarUrl` refreshes only on profile update. Manual verification: authenticated user sees correct avatar after logging in and after updating avatar.
8. `client.ts` pool is created with `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, and `statement_timeout`. Slow-query logging is present and exercised.
9. Board page loads with at most 2 sequential DB round trips before parallelization.
10. `getCardsByBoardId` no longer selects the `description` column for the board view.
11. Manual verification: board page, dashboard, trash page, and card open interactions are visibly faster. All existing tests pass (`npm test`, `npm run typecheck`, `npm run lint`).

## Out of Scope

- Replacing Drizzle ORM or the underlying `pg` driver.
- Changing the database provider (Neon).
- Migrating from NextAuth to another auth solution.
- Adding new product features (e.g. pagination of cards, virtualization).
- Rewriting the real-time (Socket.io) layer.
- Frontend performance work (bundle size, code-splitting, image optimization) — this track targets the data layer only.
- Trash page `ilike` fuzzy-search optimization (pg_trgm GIN index) — document as a future task; not included in this track.
- Card-detail API route query count optimization beyond index coverage.
