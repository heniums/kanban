# Implementation Plan: Merge Monorepo into Single Next.js Project

## Track ID

`merge_monorepo_to_single_20260630`

## Baseline Note

This track branches from `main`, where the codebase has:
- `packages/shared` with ONLY board/user schemas + 4 test files (board-schema, board, db, exports)
- `apps/server` with Express auth routes, Socket.io stub, seed script, drizzle config
- `apps/web` with NextAuth (`authorize` fetches Express), `apiFetch` helper, `/api/server/` rewrites

**Lists/cards, Server Actions for lists/cards, Zustand store, use-socket hook, server.ts custom server, JWT auth utility, positions util, lists/cards Zod schemas, socket event types** all live in the **stashed `feat/list-and-cards-management` work**, NOT on this branch. They will land when that stash is reapplied onto the new flat structure.

Therefore this track only executes the structural refactor touching code that exists on `main`. The lists-cards track's R4 (Refactor Auth & Frontend State, parts touching lists/cards) and R5 (Remove Express, already covered by this refactor) are deferred to the stash reapplication step.

---

## Phase 1: Merge Shared Package into Web App

- [ ] Task: Add shared-package dependencies to web app
    - [ ] Write tests: N/A
    - [ ] Implement: Add `jose`, `pg` to `apps/web/package.json` (already has `drizzle-orm`). Run `npm install`.
- [ ] Task: Move board schema into web app
    - [ ] Write tests: Port `packages/shared/src/__tests__/board-schema.test.ts` → `apps/web/src/lib/db/schema/__tests__/board-schema.test.ts` (adjust imports).
    - [ ] Implement: Copy `packages/shared/src/schema/boards.ts` → `apps/web/src/lib/db/schema/boards.ts`. Copy `users.ts` → `apps/web/src/lib/db/schema/users.ts`.
- [ ] Task: Move db client
    - [ ] Write tests: Port `packages/shared/src/__tests__/db.test.ts` → `apps/web/src/lib/db/__tests__/client.test.ts`.
    - [ ] Implement: Copy `packages/shared/src/db.ts` → `apps/web/src/lib/db/client.ts` exporting `createDbClient`, `DbClient`.
- [ ] Task: Move Zod schemas and types
    - [ ] Write tests: Port `packages/shared/src/__tests__/board.test.ts` → `apps/web/src/lib/schemas/__tests__/board.test.ts`.
    - [ ] Implement: Copy `packages/shared/src/schemas/{board,user}.ts` → `apps/web/src/lib/schemas/`. Copy `packages/shared/src/types/user.ts` → `apps/web/src/lib/types/user.ts`.
- [ ] Task: Update all `@kanban/shared` imports to `@/lib/...`
    - [ ] Write tests: N/A
    - [ ] Implement: Update all imports across `apps/web/src/` and `apps/server/src/` (`@kanban/shared` → `@/lib/...`, `@kanban/shared/server` → `@/lib/db/client`, `@/lib/db/schema/*`). Use grep to find all references.
- [ ] Task: Remove `packages/shared` exports test
    - [ ] Write tests: N/A
    - [ ] Implement: Delete `packages/shared/src/__tests__/exports.test.ts` (tested workspace export structure itself — no longer applicable).
- [ ] Task: Delete `packages/shared` directory
    - [ ] Write tests: N/A
    - [ ] Implement: Remove `packages/shared/` entirely. Remove from root `package.json` workspaces.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Merge Shared Package' (Protocol in workflow.md)

## Phase 2: Move DB Tooling & Remove Express Server

- [ ] Task: Move drizzle config into web app
    - [ ] Write tests: N/A
    - [ ] Implement: Copy `apps/server/drizzle.config.ts` → `apps/web/drizzle.config.ts`, update schema globs to `./src/lib/db/schema/*.ts`, out to `./drizzle`. Copy the `drizzle/` migration output folder if it exists.
- [ ] Task: Move seed script
    - [ ] Write tests: Port `apps/server/src/__tests__/seed.test.ts` → `apps/web/src/scripts/__tests__/seed.test.ts`.
    - [ ] Implement: Copy `apps/server/src/seed.ts` → `apps/web/src/scripts/seed.ts`. Update imports (use `@/lib/db/schema/*`, `@/lib/db/client`). Update `package.json` `db:seed` script.
- [ ] Task: Move users table test
    - [ ] Write tests: Port `apps/server/src/__tests__/users.test.ts` → `apps/web/src/lib/db/schema/__tests__/users.test.ts`.
    - [ ] Implement: N/A (just relocates)
- [ ] Task: Delete Express server
    - [ ] Write tests: N/A (Express tests are removed, not migrated)
    - [ ] Implement: Delete `apps/server/src/app.ts`, `index.ts`, `socket.ts`, `pool.ts`, `db.ts`, `routes/`, `schema/`, `types/`, `__tests__/` (auth.test.ts, login.test.ts, shared.test.ts, app.test.ts remain-to-remove). Keep nothing.
- [ ] Task: Remove Express dependencies from apps/server
    - [ ] Write tests: N/A
    - [ ] Implement: Remove `express`, `cors`, `@types/express`, `@types/cors`, `socket.io` from `apps/server/package.json`. Remove `apps/server` from root `package.json` workspaces.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Move DB Tooling & Remove Express' (Protocol in workflow.md)

## Phase 3: Update Auth to Direct DB Calls

- [ ] Task: Create auth data functions in web app
    - [ ] Write tests: Create `apps/web/src/lib/data/auth/__tests__/index.test.ts` covering `verifyCredentials` (valid/invalid password, missing user) and `createUser` (success, duplicate email). Mock bcryptjs and db.
    - [ ] Implement: Create `apps/web/src/lib/data/auth/index.ts` — `verifyCredentials` queries user, bcrypt compares. `createUser` hashes password, inserts, handles unique constraint. Port logic from `apps/server/src/routes/auth.ts`. Install `bcryptjs`, `@types/bcryptjs`.
- [ ] Task: Update NextAuth authorize callback
    - [ ] Write tests: Update `auth.ts` authorize tests if present; test that `verifyCredentials` is called directly (no fetch).
    - [ ] Implement: Update `apps/web/src/auth.ts` — replace `fetch(SERVER_URL/api/auth/login)` with `verifyCredentials()` from `@/lib/data/auth`. Remove `SERVER_URL` constant.
- [ ] Task: Create registration Server Action
    - [ ] Write tests: Test `registerAction` calls `createUser`, handles duplicate email, returns result.
    - [ ] Implement: Create `apps/web/src/lib/actions/auth/register.ts` — `"use server"`, Zod `registerUserSchema` validates, calls `createUser`, throws on duplicate.
- [ ] Task: Update sign-up form to use Server Action
    - [ ] Write tests: Test form calls `registerAction` instead of `apiFetch`.
    - [ ] Implement: Update `apps/web/src/components/auth/sign-up-form.tsx` — replace `apiFetch('/api/server/auth/register', ...)` with `await registerAction(data)`, then `signIn('credentials', ...)`.
- [ ] Task: Remove `apiFetch` helper and rewrites
    - [ ] Write tests: N/A
    - [ ] Implement: Delete `apps/web/src/lib/api.ts`. Remove `rewrites()` from `apps/web/next.config.ts`. Keep turbopack root config.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Update Auth to Direct DB Calls' (Protocol in workflow.md)

## Phase 4: Flatten Project to Repository Root

- [ ] Task: Move web app contents to repo root
    - [ ] Write tests: N/A
    - [ ] Implement: Move `apps/web/*` (package.json, server.ts stub if not yet created, src/, .next/, drizzle/, drizzle.config.ts, next.config.ts, tsconfig.json, vitest.config.*s, mvinhusky, eslint config, prettier config, .env) into repo root. Preserve existing `conductor/`, `.git`, `.github/` at root.
- [ ] Task: Consolidate root `package.json`
    - [ ] Write tests: N/A
    - [ ] Implement: Replace root `package.json` with the (moved) web `package.json` (rename `name` to `kanban`). Remove `workspaces`, `concurrently` devDep. Remove `@kanban/shared` and `@kanban/shared/server` deps. Merge any remaining root devDeps.
- [ ] Task: Update root scripts
    - [ ] Write tests: N/A
    - [ ] Implement: Remove `dev:server`, `dev:web`, `start:server` workspace scripts. Set `dev: "next dev"` (custom server.ts comes later via lists-cards stash). `build: "next build"`, `start: "next start"`, `typecheck: "tsc --noEmit"`, `test: "vitest run"`, `lint: "eslint ."`.
- [ ] Task: Consolidate environment variables
    - [ ] Write tests: N/A
    - [ ] Implement: Create single `.env` at repo root. Remove `NEXT_PUBLIC_API_BASE`, `SERVER_URL`, `WEB_URL`. Keep `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`. Update `.env.example`.
- [ ] Task: Delete `apps/` and `packages/` directories
    - [ ] Write tests: N/A
    - [ ] Implement: `rm -rf apps/ packages/`. Verify no remaining references in code or config.
- [ ] Task: Verify the flattened structure
    - [ ] Write tests: Run `npm test` (expect migrated essential tests + web tests passing)
    - [ ] Implement: Run `npm install`, `npm run typecheck`, `npm run lint`, `npm test`. Fix any path issues (e.g., `tsconfig.json` paths for `@/`).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Flatten Project to Repository Root' (Protocol in workflow.md)

---

## Deferred to Lists-Cards Stash Reapplication

The following spec FRs target code that only exists in the stashed `feat/list-and-cards-management` work. They execute naturally when that stash is reapplied onto the new flat structure:

- **FR-5: Refactor Zustand store to Server Actions** — `board-store.ts` does not exist on this branch (created by stash). After stash pop, update `@kanban/shared` → `@/lib/...` imports and replace `api.post/...` with Server Action calls.
- **FR-6: Update Socket.io client for same-origin** — `use-socket.ts` does not exist on this branch. After stash pop, remove `NEXT_PUBLIC_SERVER_URL` usage and same-origin `io()` call.
- **FR-9 (partial): Migrate lists/cards, positions, JWT tests** — these tests exist only in the stash. They will simply land in `apps/web/src/lib/__tests__/` (now `src/lib/__tests__/` after flatten) with `@kanban/shared` → `@/lib/...` import fixes.
- **Socket.io custom server (`server.ts`)** — the stash already created `apps/web/server.ts`. After flatten, it becomes `./server.ts` at root. Update relative imports only.

---

- [ ] Task: Reapply `feat/list-and-cards-management` stash onto flattened structure (separate follow-up)