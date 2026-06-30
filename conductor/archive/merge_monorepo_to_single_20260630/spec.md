# Track: Merge Monorepo into Single Next.js Project

## Overview

The Kanban project currently uses an npm workspaces monorepo with three packages (`apps/web`, `apps/server`, `packages/shared`). With Express being eliminated in favor of a single custom server (Socket.io attached to Next.js), only `apps/web` remains as a meaningful app. This track merges `packages/shared` and `apps/server` into the web app, flattens the project to the repository root, and absorbs phases R4 (Refactor Auth & Frontend State) and R5 (Remove Express) from the in-progress Lists & Cards track.

**Track type:** Chore / Refactor

## Functional Requirements

### FR-1: Merge Shared Package into Web App

Move all code from `packages/shared/src/` into the web app's source tree:

- DB schemas (`schema/*.ts`) → `src/lib/db/schema/`
- DB client (`db.ts`) → `src/lib/db/client.ts`
- Auth/JWT utilities (`auth/jwt.ts`) → `src/lib/auth/jwt.ts`
- Zod validation schemas (`schemas/*.ts`) → `src/lib/schemas/`
- Position utilities (`utils/positions.ts`) → `src/lib/utils/positions.ts`
- Socket.io event types (`socket/events.ts`) → `src/lib/socket/events.ts`
- All `@kanban/shared` and `@kanban/shared/server` imports updated to `@/lib/...` paths

### FR-2: Move DB Management Tooling to Root

- `apps/server/drizzle.config.ts` → root `drizzle.config.ts` (pointing to `./src/lib/db/schema/*.ts`)
- `apps/server/src/seed.ts` → `src/scripts/seed.ts`
- Remove `apps/server/src/schema/` re-export files (no longer needed)

### FR-3: Remove Express HTTP Server

Delete all of `apps/server/src/`:

- Routes (`routes/auth.ts`, `routes/lists.ts`, `routes/cards.ts`)
- Middleware (`middleware/auth.ts`, `middleware/ownership.ts`)
- Services (`services/lists.ts`, `services/cards.ts`)
- Express entry points (`app.ts`, `index.ts`, `socket.ts`, `lib/socket-registry.ts`)

### FR-4: Update NextAuth to Direct DB Calls (absorbed from R4)

- Update `src/auth.ts` authorize callback to call `verifyCredentials()` from `@/lib/data/auth` directly
- Remove `fetch(SERVER_URL/api/auth/login)` HTTP call
- Create Server Action for user registration calling `createUser()` directly

### FR-5: Refactor Zustand Store to Server Actions (absorbed from R4)

- Replace `api.post/patch/delete` calls in `src/stores/board-store.ts` with Server Action imports (`createListAction`, `updateListAction`, etc.)
- Remove `@/lib/api/client` import and the API client entirely

### FR-6: Update Socket.io Client for Same-Origin (absorbed from R4)

- Update `src/hooks/use-socket.ts` to connect with `io()` (no URL) for same-origin
- Remove `NEXT_PUBLIC_SERVER_URL` usage
- Remove `withCredentials` option (same origin sends cookies automatically)

### FR-7: Flatten Project to Repository Root

- Move all `apps/web/*` contents to repository root (`package.json`, `server.ts`, `src/`, `.env`, `tsconfig.json`, `next.config.ts`, `vitest.config.*`, etc.)
- Remove `apps/` directory
- Remove `packages/` directory
- Single `package.json` at root, no npm workspaces

### FR-8: Consolidate Environment Variables

- Single `.env` at repository root
- Remove `NEXT_PUBLIC_SERVER_URL`, `SERVER_URL`, `WEB_URL`
- Keep `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`

### FR-9: Migrate Essential Tests

- Move Zod schema tests, positions utility tests, and JWT tests from `packages/shared` into web app test tree
- Drop DB connection tests and export-roundtrip tests (those tested the workspace structure itself)
- Remove Express route/middleware tests from `apps/server`

## Non-Functional Requirements

- **No functionality regression**: All existing list/card/board operations continue working
- **All web tests pass**: Existing 147 web tests + migrated essential tests
- **Typecheck passes**: Single project, no cross-package type resolution
- **Lint passes**: ESLint + Prettier clean
- **Single process**: `npm run dev` starts one process (Next.js + Socket.io on port 3000)

## Acceptance Criteria

1. Repository root contains a single `package.json` with no workspace configuration
2. No `apps/` or `packages/` directories exist
3. `npm run dev` starts the custom server (Next.js + Socket.io) on port 3000
4. All list/card CRUD works via Server Actions → Drizzle → Neon
5. Socket.io events emit from Server Actions via in-process `getIO()` registry
6. No Express, CORS, or cross-origin cookie configuration remains
7. `drizzle.config.ts` exists at repository root
8. All `@kanban/shared` imports replaced with `@/lib/...` paths
9. `npm test`, `npm run typecheck`, `npm run lint` all pass

## Out of Scope

- Phase 7 (Board Detail Page Integration) — remains in lists-cards track
- Phase 8 (Polish, Accessibility & E2E) — remains in lists-cards track
- Any feature changes or UI modifications — this is purely a structural refactor
- Updating `conductor/tech-stack.md` to reflect the new architecture (separate documentation task)
