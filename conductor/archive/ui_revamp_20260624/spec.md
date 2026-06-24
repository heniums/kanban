# Track: UI Revamp — Spacing, Page Padding, Typography

## Overview

Refresh the global visual rhythm of the Kanban Collaboration Platform: introduce a consistent page-container pattern with generous, responsive horizontal padding; standardize typography on Inter (self-hosted via `next/font`); systematize spacing on the Tailwind v4 default scale; and verify both light and dark themes. The revamp is a **design-system / global-layout** track — no business-logic, schema, or API changes.

The goal is a calmer, more breathable interface where every route (marketing landing, sign-in / sign-up, dashboard, boards list, board view) shares the same vertical and horizontal rhythm, the same type hierarchy, and the same container width. Form surfaces (especially the sign-up form) gain bottom padding so they no longer feel "stuck to the viewport."

## Functional Requirements

### FR-1 — Global Page Container
- Every top-level route renders inside a shared `PageContainer` component (or equivalent) that:
  - Sets `max-w-7xl` (1280px) max width, centered.
  - Applies responsive horizontal padding: `px-4` (mobile) → `sm:px-6` → `lg:px-8`.
  - Provides consistent vertical rhythm (`py-8` to `py-12` depending on surface density).
- The marketing landing may opt out to use full-bleed sections, but the inner content blocks still respect the same horizontal padding.
- All current one-off `max-w-*` wrappers inside route files are removed in favor of the shared container.

### FR-2 — Typography System
- `Inter` is the sole sans-serif family, loaded once via `next/font/google` (or self-hosted via `next/font/local`) at the root layout and exposed as a CSS variable (`--font-inter`).
- A defined type scale is applied as Tailwind v4 `@theme` tokens:
  - `text-xs` 12 / `text-sm` 14 / `text-base` 16 / `text-lg` 18 / `text-xl` 20 / `text-2xl` 24 / `text-3xl` 30 / `text-4xl` 36.
  - Line-height tokens: `leading-tight` 1.25 (display), `leading-snug` 1.375 (headings), `leading-normal` 1.5 (body), `leading-relaxed` 1.625 (long-form).
- Heading hierarchy: H1 once per page (text-3xl/4xl, semibold, tight), H2 (text-2xl, semibold, snug), H3 (text-lg, medium, snug).
- Body text defaults to `text-base leading-normal`; muted/secondary text uses the `text-muted-foreground` token.

### FR-3 — Spacing System
- Continue using the Tailwind v4 default 0.25rem-based spacing scale (no custom scale override).
- Apply the same vertical spacing tokens to stacked form fields, list items, and section breaks: `space-y-4` for tight groups, `space-y-6` for form stacks, `space-y-8` / `space-y-12` for page sections.
- Buttons, inputs, and cards continue to use the existing shadcn/ui tokens; no component-level restyle is in scope unless it conflicts with new container rules.

### FR-4 — Form Bottom Spacing
- All auth forms (sign-in, sign-up) and any future form surfaces include explicit bottom padding (`pb-12` to `pb-16`) inside their scroll container so the submit button and final field never sit flush against the viewport edge.
- Sign-up form specifically gains extra bottom margin between its last field and the submit button (`mt-6`), and `mt-8` below the submit button before the page ends.

### FR-5 — Dark & Light Theme Polish
- Both themes are verified for:
  - WCAG 2.1 AA contrast on body text, muted text, headings, and primary buttons.
  - Surface elevation tokens (background, card, popover) read correctly with the new container padding.
  - No off-token colors leaked from the revamp (only Tailwind theme tokens and CSS variables).
- Theme toggle continues to work and persist per user (already in place; not modified).

### FR-6 — Affected Routes
- Marketing landing (unauthenticated `/`)
- Sign-in page
- Sign-up page (extra attention to bottom padding per FR-4)
- Authenticated dashboard (`/` for signed-in users: recent boards, shared with you, empty-state)
- Boards list (`/boards`)
- Board detail page (header, lists, card surface — no DnD or socket changes)

## Non-Functional Requirements

- **NFR-1 — Performance:** Adding `Inter` via `next/font` must not regress LCP by more than 50ms. Font is `display: 'swap'` and subset to Latin.
- **NFR-2 — Accessibility:** All new padding/typography choices preserve WCAG 2.1 AA contrast in both themes. Focus rings remain visible (existing shadcn/ui defaults are preserved).
- **NFR-3 — Consistency:** No route may define its own `max-w-*` outer container; all routes use `PageContainer` or justify the deviation in code review.
- **NFR-4 — No Regression:** No business logic, schema, real-time, or DnD behavior changes. Visual-only diff except for the new shared container.

## Acceptance Criteria

- AC-1 Visiting each route in `FR-6` shows the same outer horizontal padding at the same viewport widths.
- AC-2 The Inter font is loaded once at the root and applied to `<body>`; no flash of unstyled text (FOUT) longer than 100ms.
- AC-3 The sign-up form's submit button has at least `mt-8` clearance from the bottom of the viewport on a 1280×800 screen with no scroll.
- AC-4 `npm run typecheck`, `npm run lint`, and `npm test` all pass.
- AC-5 No file under `apps/web/src/app/**/page.tsx` or `layout.tsx` defines an ad-hoc `max-w-*` outer wrapper (verified by grep).
- AC-6 Light and dark theme screenshots of all six surfaces show consistent horizontal padding and type hierarchy.
- AC-7 Playwright visual snapshot of marketing landing, sign-in, sign-up, dashboard, boards list, and board view all match approved Figma / hand-off reference (or, if no Figma, a documented in-repo visual baseline).

## Out of Scope

- Component-level restyle of shadcn/ui primitives (radii, shadows, hover states) beyond what is required to make the new container look correct.
- New color palette, brand refresh, or accent-color changes.
- Icon set changes.
- New routes, features, or backend work.
- Mobile-specific layouts (mobile is out of MVP per product.md).
- Animation or motion-design changes.
- Replacing the underlying CSS framework or migrating off shadcn/ui.
