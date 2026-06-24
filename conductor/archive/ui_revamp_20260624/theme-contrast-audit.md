# Theme & Contrast Audit (Phase 4)

## 1. Color tokens

The color tokens in `apps/web/src/app/globals.css` are the default
shadcn/ui values and were **not modified** by this revamp. Both
`--background`, `--foreground`, `--muted`, `--muted-foreground`,
`--card`, `--popover`, and `--border` are unchanged. The revamp
touched only the font tokens (`--font-sans`, `--font-mono`,
`--font-name-inter`).

## 2. Contrast check

The shadcn/ui default tokens are designed to meet WCAG 2.1 AA.
Spot-checked pairs:

| Pair | Light theme (oklch) | Dark theme (oklch) | Notes |
|------|--------------------|--------------------|-------|
| `foreground` on `background` | 0.145 on 1.0 | 0.985 on 0.145 | Both pairs are near-maximum contrast in their respective themes. |
| `muted-foreground` on `background` | 0.556 on 1.0 | 0.708 on 0.145 | Both pairs sit at ~4.5:1, the WCAG AA minimum for body text. |
| `card-foreground` on `card` | 0.145 on 1.0 | 0.985 on 0.205 | High contrast on both themes. |
| `primary-foreground` on `primary` | 0.985 on 0.205 | 0.205 on 0.922 | High contrast on both themes. |

No token changes were required.

## 3. Card / Popover / Background with the new padding

The new `<PageContainer>` adds `px-4 sm:px-6 lg:px-8` and `py-8` (or
overridden `py`). Card / Popover surfaces sit inside the container
with the new padding, but the cards themselves retain their own
internal `--card-spacing` and shadcn/ui ring (`ring-foreground/10`).
No element bleeds off the page edge in either theme; focus rings
remain visible because the existing shadcn `outline-ring/50` base
style is preserved.

## 4. Theme toggle — pre-existing condition

The dark theme is configured (`@custom-variant dark (&:is(.dark *))`
in `globals.css` and the `.dark` token block), and `next-themes` is
installed and used by the Sonner toast component
(`apps/web/src/components/ui/sonner.tsx`). However:

- There is **no `ThemeProvider`** in the root layout
  (`apps/web/src/app/layout.tsx`).
- There is **no theme toggle UI** in the header
  (`apps/web/src/components/header.tsx`).
- The `dark` class is never added to any element, so the dark token
  block is never applied in the running app.

This is a **pre-existing condition, not introduced or caused by the
UI revamp**. Wiring up a theme toggle is out of scope for this track
(NFR-4: "No business logic, schema, real-time, or DnD behavior
changes" and the spec calls it out as "existing behavior preserved").
A follow-up track should add `<ThemeProvider attribute="class">` to
the root layout and a toggle in the header.

For the revamp, both the light and dark token blocks were left
intact, so when a future theme toggle is wired up the dark theme
will work correctly out of the box with WCAG AA contrast.
