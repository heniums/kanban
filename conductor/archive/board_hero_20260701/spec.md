# Specification: Board Hero Section

## Overview

Introduce a hero section component that displays the board's background (solid color, gradient, or future image) at the top of the board detail page and as a compact header on board cards in the dashboard. Migrate existing full-page background settings to this new hero format to improve text legibility and provide clearer visual distinction between boards.

## Functional Requirements

1. **Hero Section Component**: Create a reusable `BoardHero` component.
   - **Board detail page** (`/boards/[id]`): Full hero (default ~200px height) displaying background, board title, actions (edit, share, delete), and breadcrumb/metadata.
   - **Dashboard** (`/`): Compact hero on each board card showing background and board title.
2. **Background Migration**: Existing `background` values (solid colors, gradients) must render within the hero instead of the full page background.
3. **Hero Content Layout**:
   - Title prominently displayed.
   - Actions accessible but not intrusive.
   - Breadcrumb/metadata (e.g., last updated, owner info).
4. **Responsive Behavior**: Hero height and text size adapt on smaller screens.
5. **Accessibility**: Ensure sufficient color contrast for text overlaid on the hero background (WCAG 2.1 AA).

## Non-Functional Requirements

- Maintain existing performance (no noticeable layout shift).
- Preserve optimistic UI updates if applicable.

## Acceptance Criteria

1. Opening a board detail page shows the background as a top hero section (~200px) instead of a full-page background.
2. Board title, actions, and metadata are visible within the hero.
3. Dashboard board cards display a compact version of the hero with the board title.
4. Existing boards with backgrounds render correctly under the new hero format without manual intervention.
5. Text in the hero remains readable (contrast ratio ≥ 4.5:1).
6. Hero is responsive on tablet and desktop viewports.

## Out of Scope

- Image upload functionality (future enhancement).
- Organization/team hierarchy info in breadcrumb (deferred to post-MVP).
- Mobile-specific native app UI.
- Advanced hero customization (height per board, parallax, etc.).
