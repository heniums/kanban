# Implementation Plan: Remove Express Board Proxy

## Track ID

`rm_express_proxy_20260621`

---

## Phase 1: Shared Board Schema & DB Client

- [ ] Task: Create shared board schema package
    - [ ] Write tests: Verify board columns via information_schema (replace server boards.test.ts)
    - [ ] Implement: packages/shared/src/schema/boards.ts with pgTable, export Board type
- [ ] Task: Create shared database client
    - [ ] Write tests: Verify createDbClient() creates valid drizzle client
    - [ ] Implement: packages/shared/src/db.ts with pg Pool + drizzle(node-postgres)
- [ ] Task: Update shared package index and verify exports
    - [ ] Write tests: Verify boards schema and createDbClient are importable
    - [ ] Implement: Update packages/shared/src/index.ts, add drizzle-orm + pg deps if needed
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Shared Board Schema & DB Client' (Protocol in workflow.md)

## Phase 2: Server Cleanup

- [ ] Task: Replace server db.ts with shared re-export
    - [ ] Write tests: Verify createDbClient resolves from @kanban/shared
    - [ ] Implement: apps/server/src/db.ts re-exports from @kanban/shared
- [ ] Task: Delete server board routes, services, and tests
    - [ ] Write tests: Confirm remaining tests pass (60 expected)
    - [ ] Implement: Remove routes/boards/, services/boards/, board-services.test.ts, board-routes.test.ts
- [ ] Task: Delete server board schema and its test
    - [ ] Implement: Remove schema/boards.ts, boards.test.ts (replaced in shared)
- [ ] Task: Delete server JWT middleware and tests
    - [ ] Write tests: Confirm auth.test.ts still passes (no board dependency)
    - [ ] Implement: Remove middleware/auth.ts, tests/helpers/jwt.ts, related imports
- [ ] Task: Update server app.ts (remove board route mount)
    - [ ] Implement: Remove import and app.use for board routes
- [ ] Task: Update server seed to import from shared
    - [ ] Write tests: Verify seed script creates demo boards
    - [ ] Implement: Update seed.ts imports to @kanban/shared
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Server Cleanup' (Protocol in workflow.md)

## Phase 3: Web Cleanup

- [ ] Task: Delete server-api.ts
    - [ ] Implement: Remove apps/web/src/lib/server-api.ts
- [ ] Task: Remove jose and server-only from web dependencies
    - [ ] Implement: Remove from apps/web/package.json, reinstall
- [ ] Task: Verify web typecheck and lint pass
    - [ ] Implement: Run typecheck + lint; fix any import references
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Web Cleanup' (Protocol in workflow.md)