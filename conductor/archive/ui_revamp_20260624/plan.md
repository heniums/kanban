# Track: UI Revamp — Implementation Plan

## Phase 1: Foundation (Font, Theme Tokens, PageContainer)

- [ ] Task: Audit current layout & typography usage across `apps/web/src/app/**` to map every ad-hoc `max-w-*` wrapper, current font, and current padding pattern
  - [ ] Document findings in a short report in the track folder
  - [ ] Identify the global root layout file (`apps/web/src/app/layout.tsx`) and confirm where font/`<body>` styles are configured
- [ ] Task: Write tests for `PageContainer` component (TDD)
  - [ ] Unit test: renders children inside a `div` with `mx-auto max-w-7xl`
  - [ ] Unit test: applies `px-4 sm:px-6 lg:px-8` horizontal padding classes
  - [ ] Unit test: applies default `py-8` vertical padding, overridable via prop
  - [ ] Unit test: accepts an `as` prop (default `'div'`, allows `'section'` / `'main'`)
  - [ ] Verify all tests fail before implementation
- [ ] Task: Implement `PageContainer` component
  - [ ] Create `apps/web/src/components/layout/PageContainer.tsx`
  - [ ] Export named `PageContainer` with typed props (`children`, `as`, `className`, `py`)
  - [ ] Verify all `PageContainer` tests pass
- [ ] Task: Write tests for `Inter` font integration
  - [ ] Unit test: `next/font` is invoked with `display: 'swap'` and `subsets: ['latin']`
  - [ ] Unit test: the resulting CSS variable name matches the constant used by the root layout
- [ ] Task: Wire Inter into the root layout via `next/font`
  - [ ] Configure `next/font/google` (or local) Inter with `display: 'swap'`, `subsets: ['latin']`, exposed CSS variable `--font-inter`
  - [ ] Apply `--font-inter` as the `font-sans` Tailwind token
  - [ ] Set `font-sans` on `<body>` in root layout
  - [ ] Verify font tests pass and dev server shows Inter
- [ ] Task: Add typography `@theme` tokens to the global Tailwind v4 stylesheet
  - [ ] Confirm the existing Tailwind v4 default scale covers `text-xs` through `text-4xl`; only add overrides if the default diverges
  - [ ] Document the type scale in code comments for the next contributor
  - [ ] Verify `npm run typecheck` and `npm run lint` pass
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation (Font, Theme Tokens, PageContainer)' (Protocol in workflow.md)

## Phase 2: Route Migration (Apply PageContainer Everywhere)

- [ ] Task: Write a test that greps the route tree for forbidden ad-hoc outer `max-w-*` wrappers (AC-5)
  - [ ] Test scans `apps/web/src/app/**/page.tsx` and `layout.tsx` for `className` containing `max-w-` outside an allowed list
  - [ ] Allowed list: `max-w-7xl` (only when used inside the new `PageContainer` source file)
  - [ ] Verify test fails before the migration tasks below
- [ ] Task: Migrate marketing landing (`apps/web/src/app/(marketing)/page.tsx`) to use `PageContainer` for inner content blocks
  - [ ] Replace any `mx-auto max-w-*` wrappers with `PageContainer`
  - [ ] Preserve full-bleed hero/CTA sections; wrap only the inner content in `PageContainer`
- [ ] Task: Migrate sign-in page to use `PageContainer` as the outer wrapper
  - [ ] Replace outer `max-w-*` wrapper with `<PageContainer as="main">`
- [ ] Task: Migrate sign-up page to use `PageContainer` as the outer wrapper
  - [ ] Replace outer `max-w-*` wrapper with `<PageContainer as="main">`
- [ ] Task: Migrate authenticated dashboard (`/`) root segment to use `PageContainer`
  - [ ] Wrap recent-boards grid, shared-with-you panel, and empty-state in `PageContainer`
- [ ] Task: Migrate boards list (`/boards`) to use `PageContainer`
- [ ] Task: Migrate board detail page (`/boards/[id]`) header to use `PageContainer` (lists/cards surface keeps its own scrolling container)
- [ ] Task: Re-run the AC-5 grep test and confirm it passes
  - [ ] Update the test's allow-list to include any intentional opt-outs (with comments)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Route Migration (Apply PageContainer Everywhere)' (Protocol in workflow.md)

## Phase 3: Form Bottom Spacing (Sign-in, Sign-up)

- [ ] Task: Write tests for the sign-in form bottom spacing (FR-4)
  - [ ] Component test: rendered sign-in form's scroll container has `pb-12` (or larger) on its root
  - [ ] Component test: submit button has `mt-6` clearance from the last field
- [ ] Task: Implement sign-in form bottom spacing
  - [ ] Add `pb-12` (or `pb-16`) to the form's outer container
  - [ ] Add `mt-6` between the last field and the submit button
  - [ ] Verify sign-in form tests pass
- [ ] Task: Write tests for the sign-up form bottom spacing (FR-4 / AC-3)
  - [ ] Component test: form's outer container has `pb-12` (or larger)
  - [ ] Component test: `mt-6` between last field and submit button
  - [ ] Component test: `mt-8` between submit button and end of form
  - [ ] Visual test (Playwright at 1280×800): sign-up submit button's bounding box bottom is at least 64px from the viewport bottom without scrolling
- [ ] Task: Implement sign-up form bottom spacing
  - [ ] Add `pb-12` (or `pb-16`) to the form's outer container
  - [ ] Add `mt-6` between the last field and the submit button
  - [ ] Add `mt-8` after the submit button
  - [ ] Verify all sign-up form tests pass, including the Playwright visual test
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Form Bottom Spacing (Sign-in, Sign-up)' (Protocol in workflow.md)

## Phase 4: Dark & Light Theme Polish

- [ ] Task: Write accessibility tests for the six affected surfaces in both themes
  - [ ] axe-core / `jest-axe` test for marketing landing (light + dark)
  - [ ] axe-core test for sign-in (light + dark)
  - [ ] axe-core test for sign-up (light + dark)
  - [ ] axe-core test for dashboard (light + dark)
  - [ ] axe-core test for boards list (light + dark)
  - [ ] axe-core test for board detail (light + dark)
  - [ ] Verify tests pass after polish; fix any new violations introduced by the revamp
- [ ] Task: Audit `text-muted-foreground` usage on the six surfaces and ensure contrast ≥ 4.5:1
  - [ ] Light theme: spot-check any surface where muted text is below 4.5:1; raise token value if needed
  - [ ] Dark theme: same audit
  - [ ] Document any token changes in the track report
- [ ] Task: Audit `bg-card`, `bg-popover`, `bg-background` interactions with the new container padding
  - [ ] Visually confirm no element bleeds off the page edges in either theme
  - [ ] Confirm focus rings remain visible on all interactive elements in both themes
- [ ] Task: Confirm theme toggle still works and persists (existing behavior preserved)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Dark & Light Theme Polish' (Protocol in workflow.md)

## Phase 5: Visual Baseline & Final QA

- [ ] Task: Add Playwright visual snapshot tests for the six affected surfaces, both themes
  - [ ] Snapshot `marketing-landing--light`, `marketing-landing--dark`
  - [ ] Snapshot `sign-in--light`, `sign-in--dark`
  - [ ] Snapshot `sign-up--light`, `sign-up--dark`
  - [ ] Snapshot `dashboard--light`, `dashboard--dark`
  - [ ] Snapshot `boards-list--light`, `boards-list--dark`
  - [ ] Snapshot `board-detail--light`, `board-detail--dark`
  - [ ] Baseline the snapshots on first run; commit them as the approved reference
- [ ] Task: Manually verify all six surfaces in both themes against the spec
  - [ ] Confirm consistent horizontal padding at 375 / 768 / 1280 / 1536 viewport widths
  - [ ] Confirm heading hierarchy follows FR-2 on every page
  - [ ] Confirm sign-up submit button clearance per AC-3
- [ ] Task: Run full project verification suite
  - [ ] `npm run typecheck` — passes
  - [ ] `npm run lint` — passes
  - [ ] `npm test` — passes (including new `PageContainer`, font, route, form, a11y, and visual tests)
  - [ ] Manual dev-server walkthrough: open each route in light & dark, confirm AC-1 through AC-7
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Visual Baseline & Final QA' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 6318fac
