# Track: Dashboard (`/`) Improvement — First-Board Onboarding

**Spec:** [./spec.md](./spec.md)

This plan follows the project's TDD workflow (write tests first → implement → verify → commit) and injects a Phase Completion Verification task at the end of each phase per `conductor/workflow.md` §"Phase Completion Verification and Checkpointing Protocol".

---

## Phase 1: Marketing Landing Component

- [ ] Task: Write tests for `MarketingLanding` component
    - [ ] Add `src/components/marketing/marketing-landing.test.tsx` covering: hero renders title + both CTAs, feature highlights section renders 3 cards, footer CTA renders, links point to `/register` and `/login`, headings follow logical hierarchy (`h1` for hero title)
    - [ ] Verify tests fail (`npm test -- marketing-landing`)
- [ ] Task: Implement `MarketingLanding` component
    - [ ] Create `src/components/marketing/marketing-landing.tsx` as a server component (no `"use client"`)
    - [ ] Use shadcn `Button` (`asChild` with `Link`) for CTAs; use Lucide icons for the 3 feature cards
    - [ ] Use Tailwind tokens only; respect responsive breakpoints (1280px+ / 768–1279px)
    - [ ] Run `npm test -- marketing-landing` and verify all tests pass
- [ ] Task: Commit Phase 1
    - [ ] `git add` the new files
    - [ ] Commit with message `feat(dashboard): add marketing landing component`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Marketing Landing Component' (Protocol in workflow.md)
    - [ ] Run `npm run lint`, `npm run typecheck`, `npm test`
    - [ ] Manually render the component in a dev build; verify copy is direct, no exclamation marks, "board"/"card" terminology, all CTAs reachable via keyboard
    - [ ] Fix any issues before Phase 2

---

## Phase 2: First-Run Empty-State Component

- [ ] Task: Write tests for `FirstRunEmptyState` component
    - [ ] Add `src/components/dashboard/first-run-empty-state.test.tsx` covering: renders "No boards yet." headline, renders supporting line, renders primary CTA linking to `/boards/new` with text "Create your first board", renders secondary "Browse shared boards" link to `/boards`
    - [ ] Verify tests fail (`npm test -- first-run-empty-state`)
- [ ] Task: Implement `FirstRunEmptyState` component
    - [ ] Create `src/components/dashboard/first-run-empty-state.tsx` as a server component
    - [ ] Centered, prominent layout: large headline, supporting line, primary `Button asChild Link` to `/boards/new`, secondary text `Link` to `/boards`
    - [ ] Use Tailwind tokens; verify AA contrast in light and dark
    - [ ] Run `npm test -- first-run-empty-state` and verify all tests pass
- [ ] Task: Commit Phase 2
    - [ ] `git add` the new files
    - [ ] Commit with message `feat(dashboard): add first-run empty-state component`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: First-Run Empty-State Component' (Protocol in workflow.md)
    - [ ] Run `npm run lint`, `npm run typecheck`, `npm test`
    - [ ] Render in dev build with an authenticated test user (zero boards); verify focus order, screen-reader headings, link targets
    - [ ] Fix any issues before Phase 3

---

## Phase 3: Dashboard Home Component

- [ ] Task: Write tests for `DashboardHome` component
    - [ ] Add `src/components/dashboard/dashboard-home.test.tsx` covering: renders "Dashboard" h1, renders "Create board" button → `/boards/new`, renders at most 6 owned boards sorted by `updatedAt` desc, renders "View all" link with extra count when `owned.length > 6`, hides "Shared with you" section when `shared` is empty, shows up to 3 shared boards with "View all" link when `shared.length > 3`
    - [ ] Mock `BoardCard` rendering to assert the count and ordering without depending on its internals
    - [ ] Verify tests fail (`npm test -- dashboard-home`)
- [ ] Task: Implement `DashboardHome` component
    - [ ] Create `src/components/dashboard/dashboard-home.tsx` as a server component
    - [ ] Accept props: `{ owned: Board[]; shared: Board[] }` (types from `@kanban/shared`)
    - [ ] Header row with `h1` "Dashboard" and `Button asChild Link` "Create board" → `/boards/new`
    - [ ] Recent boards section: `slice(0, 6)` of `owned` (already sorted by `listBoardsAction` by `updatedAt` desc) in a grid (`sm:grid-cols-2 lg:grid-cols-3`) using `BoardCard`
    - [ ] "View all" link to `/boards` when `owned.length > 6`, displaying the additional count
    - [ ] Conditional "Shared with you" section: render only if `shared.length > 0`; show up to 3 cards; "View all" link when `shared.length > 3`
    - [ ] Run `npm test -- dashboard-home` and verify all tests pass
- [ ] Task: Commit Phase 3
    - [ ] `git add` the new files
    - [ ] Commit with message `feat(dashboard): add dashboard home component with recent and shared previews`
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dashboard Home Component' (Protocol in workflow.md)
    - [ ] Run `npm run lint`, `npm run typecheck`, `npm test`
    - [ ] Render in dev build with an authenticated user that has >6 owned and >3 shared boards; verify grid responsive behavior, hidden section when shared is empty, link counts
    - [ ] Fix any issues before Phase 4

---

## Phase 4: Wire the Root Route `/`

- [ ] Task: Write tests for `app/page.tsx` role-aware branching
    - [ ] Add `src/app/page.test.tsx` covering the three branches:
        - [ ] Unauthenticated: renders `MarketingLanding`; no redirect
        - [ ] Authenticated, 0 owned boards: renders `FirstRunEmptyState` (mock `listBoardsAction` to return `{ owned: [], shared: [] }`)
        - [ ] Authenticated, ≥1 owned board: renders `DashboardHome` with the `owned` and `shared` props (mock `listBoardsAction` to return non-empty lists)
    - [ ] Mock `auth()` from `@/auth` and `listBoardsAction` from `@/lib/actions/boards`
    - [ ] Verify tests fail (`npm test -- page.test`)
- [ ] Task: Implement `app/page.tsx` role-aware branching
    - [ ] Replace the current placeholder `src/app/page.tsx` with a server component that:
        - [ ] Calls `auth()` from `@/auth`
        - [ ] If no session, returns `<MarketingLanding />`
        - [ ] Else calls `listBoardsAction()` and branches on `owned.length`:
            - [ ] `0` → returns `<FirstRunEmptyState />`
            - [ ] `>0` → returns `<DashboardHome owned={owned} shared={shared} />`
    - [ ] Do not modify `auth()`, `listBoardsAction`, `/boards/new`, or any board-related files
    - [ ] Run `npm test -- page.test` and verify all tests pass
- [ ] Task: Manual smoke test the three branches
    - [ ] Sign out, visit `/` → confirm marketing landing renders
    - [ ] Sign up a new user, visit `/` → confirm first-run empty-state with CTA
    - [ ] Click the CTA → confirm `/boards/new` form renders; submit; confirm redirect to `/boards/[id]`
    - [ ] Navigate back to `/` → confirm dashboard home with the new board in the recent grid
    - [ ] Seed a shared board for the user; confirm "Shared with you" preview appears on `/`
- [ ] Task: Commit Phase 4
    - [ ] `git add` the modified `app/page.tsx` and new test file
    - [ ] Commit with message `feat(dashboard): wire role-aware branching at root route`
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Wire the Root Route /' (Protocol in workflow.md)
    - [ ] Run `npm run lint`, `npm run typecheck`, `npm test`
    - [ ] Walk the full manual smoke test (previous task) end-to-end
    - [ ] Verify AC-1 through AC-10 from `spec.md` are all satisfied
    - [ ] Fix any issues; re-run quality gates
