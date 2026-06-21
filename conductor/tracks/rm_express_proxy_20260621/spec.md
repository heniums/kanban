# Specification: Remove Express Board Proxy

## Track ID

`rm_express_proxy_20260621`

## Overview

Remove the Express.js middleman for board CRUD operations. Instead, Next.js Server Actions and Server Components call Drizzle ORM directly using a shared database client and schema package. The board data access becomes a single hop (Next.js → Neon) instead of the current three-hop chain (Next.js → JWS → Express → Neon).

Express continues to exist for its core purpose: Socket.io real-time collaboration (future track).

## Context & Constraints

- **Tech stack:** Next.js 16 App Router, Drizzle ORM, Neon PostgreSQL, NextAuth v5.
- **Auth:** Server Actions and Server Components obtain user identity via NextAuth's `auth()` (server-side). No JWT minting, no Express `requireAuth` needed for board operations.
- **Database:** Both apps share the same Neon database. A single shared Drizzle client avoids connection duplication.
- **Board management track (`board_mgmt_20260620`)** is the consumer — Phase 3 (board UI) will use this refactored data layer.

## Functional Requirements

### FR1 — Remove Express Board Layer

Delete all board-specific Express artifacts:
- `apps/server/src/routes/boards/` (6 handler files + index.ts)
- `apps/server/src/schema/boards.ts` (moved to shared)
- `apps/server/src/services/boards/` (7 repository files + types.ts)
- `apps/server/src/__tests__/board-services.test.ts`
- `apps/server/src/__tests__/board-routes.test.ts`
- `apps/server/src/__tests__/boards.test.ts` (schema test — replaced in shared)
- `apps/server/src/app.ts` mount line (`app.use('/api/boards', boardRoutes)`)
- `apps/server/src/middleware/auth.ts` and its tests (Express JWT middleware — no consumer remains)

### FR2 — Shared Drizzle Board Schema

- Create `packages/shared/src/schema/boards.ts` with the `boards` `pgTable` definition, using `drizzle-orm/pg-core`.
- Export the `Board` type (`typeof boards.$inferSelect`) from shared.
- `drizzle-orm` is already a dependency of `@kanban/shared` via workspace resolution — verify and add explicitly if needed.

### FR3 — Shared Database Client

- Create `packages/shared/src/db.ts` with `createDbClient()` using `drizzle-orm/node-postgres` + `pg.Pool`.
- Both `apps/server` and `apps/web` import `createDbClient` from `@kanban/shared`.
- Server's existing `apps/server/src/db.ts` becomes a re-export from shared (or deleted).

### FR4 — Remove Web JWS Layer

- Delete `apps/web/src/lib/server-api.ts` (JWS minting + Express proxy — unused after refactor).
- Remove `jose` and `server-only` from `apps/web/package.json` (no longer needed).

### FR5 — Server Seed Update

- Update seed script to import board schema from `@kanban/shared` instead of local path.

## Non-Functional Requirements

- **Gate:** All server tests pass, no typecheck/lint regressions.
- **Coverage:** Board schema test remains in shared (schema column check).
- **No lockfile churn:** Minimize package-lock.json changes.

## Acceptance Criteria

- **AC1:** Express `/api/boards` routes no longer exist. `app.ts` has no board mount.
- **AC2:** `npm test --workspace apps/server` passes with remaining tests (auth, db, users, seed, app).
- **AC3:** Shared package exports `boards` schema and `createDbClient`. Both apps import from `@kanban/shared`.
- **AC4:** `apps/web/src/lib/server-api.ts` is deleted. No code in web imports `jose`.
- **AC5:** Server seed script works (`npm run db:seed --workspace apps/server`) — imports boards from shared.
- **AC6:** Typecheck and lint pass in all workspaces.

## Out of Scope

- Board UI pages (that's `board_mgmt` Phase 3+).
- Socket.io real-time features.
- User/auth routes (unaffected).