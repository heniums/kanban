# UI Revamp — Audit Report

Audit of current layout, typography, and spacing usage across
`apps/web/src/app/**` and `apps/web/src/components/**` prior to the revamp.

## 1. Ad-hoc `max-w-*` wrappers (target of AC-5)

Found 10 occurrences of `max-w-` across the codebase.

| Location | Current | Status |
|----------|---------|--------|
| `apps/web/src/app/login/page.tsx:58` | `<Card className="w-full max-w-md">` | Migrate outer wrapper to `<PageContainer as="main">`; keep `max-w-md` on the Card itself (form surface width) |
| `apps/web/src/app/register/page.tsx:69` | `<Card className="w-full max-w-md">` | Same as login |
| `apps/web/src/components/dashboard/first-run-empty-state.tsx:7` | `<div className="mx-auto max-w-md space-y-6">` | Inner content width; the outer `main` uses `container` — replace outer with `<PageContainer as="main">` |
| `apps/web/src/app/boards/page.tsx:13` | `<main className="container py-8">` | Replace `container` with `<PageContainer as="main">` |
| `apps/web/src/app/boards/loading.tsx:5` | `<main className="container py-8">` | Same |
| `apps/web/src/app/boards/[boardId]/page.tsx:29` | `<div className="mx-auto max-w-7xl px-4 py-8">` | Replace with `<PageContainer>` (the outer colored wrapper stays full-bleed; only the inner content gets the container) |
| `apps/web/src/components/marketing/marketing-landing.tsx:26` | `<section className="mx-auto flex max-w-3xl …">` | Inner content width — keep the `max-w-3xl` on the inner content blocks (FR-1 explicit opt-out for marketing inner sections); outer `main` switches to `PageContainer` |
| `apps/web/src/components/marketing/marketing-landing.tsx:43` | `<section className="mx-auto mt-20 grid max-w-5xl …">` | Same — inner block width |
| `apps/web/src/components/marketing/marketing-landing.tsx:59` | `<section className="mx-auto mt-20 flex max-w-3xl …">` | Same — inner block width |
| `apps/web/src/components/boards/new-board-form.tsx:61` | `<Card className="w-full max-w-lg">` | New board form — outer wrapper switch to `<PageContainer as="main">`; the form Card keeps `max-w-lg` (form surface width) |

**AC-5 test scope:** `apps/web/src/app/**/page.tsx` and `apps/web/src/app/**/layout.tsx`. The marketing inner `max-w-3xl` / `max-w-5xl` blocks live in a component (not a page), so they are out of scope for the AC-5 grep test by definition. The `Card` `max-w-md` / `max-w-lg` on auth/new-board forms are form-surface widths, not page wrappers.

**AC-5 allow-list:**
- `max-w-7xl` only inside `apps/web/src/components/layout/PageContainer.tsx`.
- Form `Card` `max-w-md` / `max-w-lg` are content widths, not page wrappers, but the AC-5 grep is keyed off `app/**/page.tsx` so it does not flag them.

## 2. Current font setup

`apps/web/src/app/layout.tsx` imports `Geist` and `Geist_Mono` from `next/font/google`,
exposes them as CSS variables `--font-geist-sans` and `--font-geist-mono`, and
applies both to `<html>`.

`apps/web/src/app/globals.css` already has `--font-sans: var(--font-sans)` in
`@theme inline` (and a second `--font-sans: var(--font-sans)` self-reference in
the body style) and applies `font-sans` to `html` via `@apply`. The
`--font-sans` token currently resolves to `--font-geist-sans` (the variable
exposed by `Geist`).

**Revamp change:** swap `Geist` for `Inter` (the spec calls for Inter as the
sole sans family). Inter is exposed as `--font-inter`; the layout will bind
`--font-sans: var(--font-inter)`.

## 3. Current padding pattern

| Location | Classes | Notes |
|----------|---------|-------|
| `marketing-landing.tsx:25` | `container py-16` | Tailwind `container` class — not the spec's `mx-auto max-w-7xl px-*` pattern |
| `boards/page.tsx:13` | `container py-8` | Same |
| `boards/loading.tsx:5` | `container py-8` | Same |
| `first-run-empty-state.tsx:6` | `container … py-16` | Same |
| `dashboard-home.tsx:28` | `container py-8` | Same |
| `header.tsx:28` | `container flex h-14 …` | Header — keep as-is (header is not a page container) |
| `boards/[boardId]/page.tsx:29` | `mx-auto max-w-7xl px-4 py-8` | Close to spec — but written by hand |

**Revamp change:** all `container py-*` outer wrappers switch to
`<PageContainer as="main" py="…">`; the board detail page uses `<PageContainer>`
explicitly. The header keeps its existing `container` because it has a
non-page role (sticky top bar).

## 4. Affected routes (FR-6)

| Route | File | Action |
|-------|------|--------|
| Marketing landing (unauthenticated `/`) | `apps/web/src/components/marketing/marketing-landing.tsx` | Outer `main` uses `PageContainer`; inner sections keep their `max-w-3xl/5xl` (FR-1 opt-out) |
| Sign-in | `apps/web/src/app/login/page.tsx` | Outer wrapper becomes `<PageContainer as="main">` |
| Sign-up | `apps/web/src/app/register/page.tsx` | Same; add `pb-12` and `mt-6` / `mt-8` (FR-4) |
| Authenticated dashboard (`/`) | `apps/web/src/components/dashboard/dashboard-home.tsx`, `first-run-empty-state.tsx` | Outer `main` uses `PageContainer` |
| Boards list (`/boards`) | `apps/web/src/app/boards/page.tsx`, `boards/loading.tsx` | Same |
| Board detail (`/boards/[boardId]`) | `apps/web/src/app/boards/[boardId]/page.tsx` | Header content uses `<PageContainer>`; lists/cards surface keeps its own scroll container |

## 5. New files to create

- `apps/web/src/components/layout/PageContainer.tsx` — the shared container.
- `apps/web/src/__tests__/page-container.test.tsx` — vitest unit tests for it.
- `apps/web/src/__tests__/font.test.ts` — vitest unit tests for the Inter wiring
  (regression guard for the `--font-inter` constant and `display: 'swap'` /
  `subsets: ['latin']` configuration).
- `apps/web/src/__tests__/no-adhoc-page-wrappers.test.ts` — vitest test that
  greps `app/**/page.tsx` and `layout.tsx` for forbidden `max-w-*` (AC-5).
- `apps/web/src/__tests__/signin-form-spacing.test.tsx` — sign-in form bottom
  spacing (FR-4).
- `apps/web/src/__tests__/signup-form-spacing.test.tsx` — sign-up form bottom
  spacing (FR-4 / AC-3).
- `apps/web/e2e/visual-snapshots.spec.ts` — Playwright visual snapshot tests
  for the six surfaces in both themes.
- `apps/web/e2e/signup-clearance.spec.ts` — Playwright test that verifies the
  sign-up submit button's clearance at 1280×800.
- `apps/web/e2e/a11y.spec.ts` — axe-core a11y tests for the six surfaces in
  both themes.

## 6. Tailwind v4 default scale — verification note

The spec (FR-2) defines:
- `text-xs` 12 / `text-sm` 14 / `text-base` 16 / `text-lg` 18 / `text-xl` 20 /
  `text-2xl` 24 / `text-3xl` 30 / `text-4xl` 36.

Tailwind v4's default `--text-*` scale (verified in
`node_modules/tailwindcss/theme.css`) matches these values. **No
`@theme` overrides are required for the type scale.**

For line-heights, Tailwind v4 already provides:
- `leading-tight` = `--leading-tight` (1.25)
- `leading-snug` = `--leading-snug` (1.375)
- `leading-normal` = `--leading-normal` (1.5)
- `leading-relaxed` = `--leading-relaxed` (1.625)

…all matching the spec. **No `@theme` overrides are required for line-heights
either.** A short comment in `globals.css` documents the type scale for
future contributors.
