# Implementation Plan: Board Hero Section

## Phase 1: Board Hero Component

- [ ] Task: Write unit tests for BoardHero component
  - [ ] Test rendering with solid color background
  - [ ] Test rendering with gradient background
  - [ ] Test full variant (board detail) layout and height (~200px)
  - [ ] Test compact variant (dashboard card) layout
  - [ ] Test text color contrast helper integration
  - [ ] Test accessibility (aria labels, roles)
- [ ] Task: Implement BoardHero component
  - [ ] Create `src/components/boards/board-hero.tsx`
  - [ ] Define props interface (board, variant, children)
  - [ ] Implement background rendering for solid/gradient
  - [ ] Implement full variant styling and layout
  - [ ] Implement compact variant styling and layout
  - [ ] Integrate `getTextColor` for accessible overlaid text
- [ ] Task: Verify component tests pass
- [ ] Task: Commit component
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Board Hero Component' (Protocol in workflow.md)

## Phase 2: Board Detail Page Integration

- [ ] Task: Write tests for board detail page hero integration
  - [ ] Test hero renders at top of board page
  - [ ] Test full-page background is removed
  - [ ] Test board title, actions, and metadata render inside hero
  - [ ] Test responsive behavior
- [ ] Task: Implement board detail page hero integration
  - [ ] Refactor `src/app/boards/[boardId]/page.tsx` to remove page-level background
  - [ ] Import and render `BoardHero` in full variant
  - [ ] Move board title, description, breadcrumb, and actions into hero
  - [ ] Ensure board lists render below hero with neutral background
- [ ] Task: Verify integration tests pass
- [ ] Task: Commit board detail integration
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Board Detail Page Integration' (Protocol in workflow.md)

## Phase 3: Dashboard & Board Card Integration

- [ ] Task: Write tests for dashboard/board card hero integration
  - [ ] Test compact hero renders on board cards
  - [ ] Test board title and actions are visible within compact hero
  - [ ] Test navigation from hero to board detail
- [ ] Task: Implement dashboard/board card hero integration
  - [ ] Refactor `src/components/boards/board-card.tsx` to use `BoardHero` compact variant
  - [ ] Overlay board title and actions on compact hero background
  - [ ] Ensure responsive grid layout remains intact
  - [ ] Update `src/app/boards/page.tsx` and `src/components/dashboard/dashboard-home.tsx` if needed
- [ ] Task: Verify integration tests pass
- [ ] Task: Commit dashboard integration
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dashboard & Board Card Integration' (Protocol in workflow.md)

## Phase 4: Background Migration & Polish

- [ ] Task: Write E2E tests for hero section flows
  - [ ] Test existing boards with backgrounds render correctly in hero
  - [ ] Test hero visibility and readability on board detail
  - [ ] Test hero visibility and readability on dashboard
  - [ ] Test responsive behavior across viewports
- [ ] Task: Implement background migration and polish
  - [ ] Verify existing `background` values map correctly to hero without schema changes
  - [ ] Ensure text readability (contrast) across all background types
  - [ ] Add Storybook stories or visual tests if applicable
  - [ ] Run full test suite (`npm test`)
  - [ ] Run typecheck (`npm run typecheck`)
  - [ ] Run lint (`npm run lint`)
  - [ ] Manual verification of phase deliverables
- [ ] Task: Commit polish and migration
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Background Migration & Polish' (Protocol in workflow.md)
