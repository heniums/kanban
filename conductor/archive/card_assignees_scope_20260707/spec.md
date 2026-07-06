# Specification: Card Detail Assignees Lists All Users

## Overview

The card detail page's assignees selector incorrectly lists every registered user in the system, instead of scoping the list to only members of the current board.

## Root Cause

In `/src/app/api/cards/[cardId]/route.ts` (lines 71–74), the `boardMembersList` query performs an unscoped `SELECT id, name, email FROM users ORDER BY name ASC` — pulling every user in the database with no board membership filter.

## Scope

### Primary Fix

Replace the unscoped users query in the card detail API route with a board-scoped join that filters users by board membership via the `board_members` table, using the card's `boardId`.

### Secondary: Audit for Similar Bugs

Search the codebase for other unscoped user queries in board-related contexts (API routes, Server Actions, data layer) and fix any found, ensuring user lists are always filtered to the relevant board.

## Functional Requirements

1. The `GET /api/cards/[cardId]` endpoint must return only board members in `boardMembers`, not all users
2. Any similar unscoped user queries found during audit must be fixed to scope to their context

## Acceptance Criteria

1. Opening the card detail assignees dropdown on a board with 3 members shows exactly 3 users, not all system users
2. Unit tests verify the scoped query returns only members of the target board
3. `npm run typecheck`, `npm run lint`, and `npm test` pass

## Out of Scope

- E2E tests
- Integration tests
- UI changes to the assignees control component
