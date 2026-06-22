# Track: Dashboard (`/`) Improvement — First-Board Onboarding

## Overview

The root route (`/`) is currently a static placeholder ("Your boards will appear here…") that gives new users no path to value. This track turns `/` into a role-aware landing experience:

- **Unauthenticated visitors** see a public marketing landing.
- **Authenticated users with zero boards** see a focused first-run onboarding empty-state that funnels them to the existing `/boards/new` flow.
- **Authenticated users with one or more boards** see a "Recent boards" preview plus a persistent "Create board" entry point. The full list continues to live at `/boards`.

The goal is to satisfy the product success metric: *users can create a board and start collaborating within 2 minutes* by removing dead-ends on the root route.

## Functional Requirements

### FR-1. Role-Aware Routing at `/`
The `/` route is a server component that branches on authentication and board count.

| Condition | Render |
|-----------|--------|
| Not authenticated | `MarketingLanding` (FR-2) |
| Authenticated, 0 owned boards | `FirstRunEmptyState` (FR-3) |
| Authenticated, ≥1 owned board | `DashboardHome` (FR-4) |

Board count is derived from the same data source as `/boards` (existing `listBoardsAction`), so the two pages stay in sync. No new data layer is required.

### FR-2. Marketing Landing (Unauthenticated)
A server-rendered public landing page rendered at `/` for unauthenticated visitors. Sections, in order:

1. **Hero** — Product name, one-sentence value proposition, two CTAs:
   - "Get started" → `/register`
   - "Sign in" → `/login`
2. **Feature highlights** — 3 short cards summarizing: real-time collaboration, kanban boards, sharing. (Icons + one-line copy. No marketing fluff — direct, action-oriented per product guidelines.)
3. **Footer CTA** — Repeated "Get started" button.

No auth wall, no dashboard chrome visible. The global `Header` continues to render above the landing.

**Copy rules** (from `product-guidelines.md`): direct, active verbs, no exclamation marks, "board" not "project", "card" not "ticket".

### FR-3. First-Run Empty State (Authenticated, 0 Boards)
Centered, prominent empty-state with:

- A short headline: "No boards yet."
- A supporting line: "Create your first board to get started." (Aligns with the existing copy on `/boards`.)
- A single primary CTA button: "Create your first board" → `/boards/new`.
- Optional secondary link: "Browse shared boards" → `/boards` (which will show the "Shared with me" section; relevant once invites exist).

Visually, this is a focused, single-purpose screen — not a list page with an empty list. No inline form is rendered on `/`; the form lives at `/boards/new` and is reused (FR-6).

### FR-4. Dashboard Home (Authenticated, ≥1 Board)
A summary view at `/` for users who have boards. Sections:

1. **Header row** — Page title "Dashboard" and a "Create board" button (links to `/boards/new`). Mirrors the header row on `/boards` for visual consistency.
2. **Recent boards** — A grid of up to 6 most-recently-updated boards the user owns, rendered using the existing `BoardCard` component. Sorted by `updatedAt` desc.
3. **View all** — A text link to `/boards` for users with >6 boards, showing the count of additional boards.

If the user has any shared boards (existing `shared` list from `listBoardsAction` is non-empty), a small "Shared with you" preview of up to 3 cards is shown beneath the owned grid with a "View all" link to `/boards`. If `shared` is empty, this section is hidden (it would otherwise duplicate the `/boards` empty-state copy).

**Out of dashboard scope:** board search, filtering, favorites, activity feed (these are explicitly deferred in `product.md` and are not in scope for this track).

### FR-5. CTA Behavior
- All "Create board" CTAs across the three dashboard variants link to `/boards/new`. No inline form, no modal.
- "Get started" and "Sign in" CTAs on the marketing landing link to `/register` and `/login` respectively.
- No new keyboard shortcuts or new entry points beyond the links above.

### FR-6. Reuse Existing Create Flow
The `/boards/new` page is unchanged. After it creates a board, the existing redirect-to-`/boards/[id]` behavior applies (it is already implemented). This track does not modify the create form, the create action, or the post-create navigation.

## Non-Functional Requirements

- **NFR-1. Performance:** The dashboard is server-rendered. No client-side data fetching is added. The marketing landing must have no JavaScript-dependent above-the-fold content.
- **NFR-2. Accessibility:** WCAG 2.1 AA. All CTAs are real `<a>` or `<Link>` elements (not `<div onClick>`). The first-run empty-state has a logical heading hierarchy (`h1` for page title, `h2` for any sub-sections). Focus is visible. Color contrast meets AA in both light and dark themes.
- **NFR-3. Responsive:** The marketing landing is responsive at the project's breakpoints (1280px+ desktop, 768–1279px tablet). Mobile is out of scope per `product.md`. The dashboard home grid uses the same responsive grid (`sm:grid-cols-2 lg:grid-cols-3`) as `/boards`.
- **NFR-4. Theming:** Works in both light and dark mode (dark is default per `product-guidelines.md`). No hard-coded colors; uses Tailwind tokens (`text-foreground`, `bg-background`, `text-muted-foreground`, etc.).
- **NFR-5. i18n / copy:** Copy is English-only and stored inline in components for now. No externalization in this track.
- **NFR-6. Type safety:** All components are typed. No `any`. Server actions and Drizzle types are reused as-is.

## Acceptance Criteria

A track is complete when **all** of the following hold:

1. **AC-1. Setup routing:** Visiting `/` while signed out renders the marketing landing. No redirect to `/login`.
2. **AC-2. Empty-state routing:** A signed-in user with zero owned boards lands on `/` and sees the first-run empty-state with a "Create your first board" button that navigates to `/boards/new`.
3. **AC-3. Dashboard routing:** A signed-in user with ≥1 owned board lands on `/` and sees the dashboard home with a "Recent boards" grid (max 6), sorted by most-recently-updated, and a "Create board" button.
4. **AC-4. Shared preview:** When the signed-in user has shared boards, a "Shared with you" preview of up to 3 is shown on the dashboard. When empty, the section is hidden.
5. **AC-5. Create flow unchanged:** Submitting the form at `/boards/new` still creates a board and redirects to `/boards/[id]`. (No regression in the existing create flow.)
6. **AC-6. View all:** A "View all" link to `/boards` is shown when the user has more than 6 owned boards (or >3 shared boards) and the count is displayed.
7. **AC-7. Tests pass:** All existing tests still pass. New unit/integration tests are added covering the three render branches and the "shared preview hidden when empty" rule. TDD per `workflow.md`.
8. **AC-8. Quality gates:** `npm run lint`, `npm run typecheck`, and `npm test` all pass. `prefers-reduced-motion` is respected (no new motion added in this track, so a no-op pass).
9. **AC-9. Manual verification:** A developer can sign up, be redirected to `/`, see the empty-state, click the CTA, create a board, land on `/boards/[id]`, navigate back to `/`, and see the new board in the recent grid.
10. **AC-10. Accessibility check:** Keyboard-only navigation reaches every CTA and link on the dashboard. Screen reader announces the page title and CTA labels correctly.

## Out of Scope

- Inline board creation form or modal on `/` (the CTA goes to `/boards/new`).
- Modifying the `/boards/new` page, the `createBoardAction`, or the post-create redirect.
- Board search, filtering, sorting controls, or favorites on `/`.
- Activity feed or recent activity dashboard.
- Onboarding tour, tooltips, or multi-step guided flows.
- Mobile-specific layouts.
- Internationalization or copy externalization.
- Changing the global `Header`.
- Analytics or telemetry.
- Real-time presence on the dashboard (this is a board feature, not a dashboard feature).
