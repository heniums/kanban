# Product Guidelines: Kanban Collaboration Platform

## Visual Design

### Aesthetic: Modern & Vibrant
The interface balances professionalism with visual energy. Bold accent colors, rounded corners, and subtle gradients create an engaging yet productive environment. Playful micro-interactions (like card flips on completion or spring-based drag animations) reward user actions without being distracting.

**Key visual attributes:**
- **Colors:** Vibrant primary palette (royal blue, emerald green, coral red, amber yellow) on clean white/dark surfaces. Board backgrounds support gradient and solid color options.
- **Typography:** Modern sans-serif (Inter or system font stack). Clear hierarchy with 4-5 weight/size levels.
- **Shapes:** 8px border radius default. Cards, buttons, modals all use consistent rounding.
- **Shadows:** Soft, colored shadows (not pure black) for depth. Elevated elements like modals use larger blur + color tint.
- **Icons:** Phosphor or Lucide icon set — crisp, consistent, 24px grid.

### Dark Mode First
- Default theme is dark (slate/neutral palette) with a light mode toggle.
- All components must be designed and tested in both modes.
- Color contrast ratios meet WCAG AA minimums (4.5:1 for text, 3:1 for large text/graphics).
- Theme preference persisted per user and synced across sessions.

## UX Principles

### 1. Speed & Responsiveness (Primary)
- **Optimistic UI:** All mutations (card moves, edits, creation) render instantly on the client and reconcile with the server in the background.
- **Drag-and-Drop:** Fluid, spring-physics-based drag. Drop targets highlight with color pulses. Cards slide apart to show insertion point.
- **Loading States:** Skeleton loaders (not spinners) for initial loads. Inline progress indicators for async actions.
- **Perceived Performance:** Prefetch board data on hover, lazy load card details, debounce search inputs.

### 2. Progressive Disclosure
- Boards show lists and card titles by default. Card details open in a side panel or modal.
- Advanced filters and search hidden behind a toggle.
- Admin panels accessible from a discreet settings icon, not cluttering the main UI.

### 3. Discoverability
- First-run onboarding: empty states with clear CTAs ("Create your first board"), tooltips on key interactions.
- Contextual help: "?" icon in headers linking to relevant documentation.
- Undo/redo for destructive actions (delete card, archive board). Toast notifications with undo button.

### 4. Accessibility (WCAG 2.1 AA)
- Full keyboard navigation: Tab through cards, Space to select, Enter to open, arrow keys to move.
- Screen reader announcements for real-time changes (e.g., "John moved 'Fix Login Bug' to In Review").
- Focus indicators visible on all interactive elements.
- All images/icons have alt text or are marked decorative.
- Drag-and-drop has keyboard-accessible alternatives (context menu "Move to...").

## Brand Voice

### Tone: Professional & Concise
Copy is clear, direct, and action-oriented. No fluff, no marketing speak. Every word earns its place.

**Guidelines:**
- **Be direct:** "Move card" not "Would you like to move this card?"
- **Use active verbs:** Create, Assign, Archive, Share, Move
- **Be helpful, not chatty:** Error messages explain what happened and what to do next, without fake empathy.
- **Consistent terminology:** Always "board" never "project." Always "card" never "ticket" or "task."
- **No exclamation marks** in UI copy. Reserve enthusiasm for user achievements only (completing a board, hitting a streak).

**Examples:**
| Context | Do | Don't |
|---------|----|---- |
| Empty state | "No boards yet. Create one to get started." | "Looks like you don't have any boards! Let's fix that!" |
| Error | "Failed to move card. Please try again." | "Oops! Something went wrong. We're on it!" |
| Success | "Board created." | "Your new board is ready to go! 🎉" |
| Confirmation | "Delete this board? This action cannot be undone." | "Are you sure you want to delete? We'll miss you!" |

## Design System

### Component Consistency
- Shared component library with strict TypeScript props. Every interactive element — buttons, inputs, selects, modals, toasts, avatars — is a design system component, never a one-off.
- Variants defined by props: `variant="primary" | "secondary" | "ghost"`, `size="sm" | "md" | "lg"`.
- Component stories/catalog for visual regression testing.

### Animation & Delight
- **Transitions:** 150-200ms ease-out for UI state changes (open/close, show/hide).
- **Spring Physics:** Card drag uses spring animation (stiffness: 300, damping: 25) for natural feel.
- **Feedback:** Button press scales to 97% briefly. Successful actions pulse green briefly.
- **Skeleton Loaders:** Pulsing gradient animation during data fetches. Matches content layout exactly.
- **Restraint:** Animations respect `prefers-reduced-motion`. No infinite animations, no auto-playing video.

## Responsive Breakpoints
- **Desktop:** 1280px+ — Multi-column board with side panels.
- **Tablet:** 768px-1279px — Horizontal-scroll boards, collapsed sidebar.
- **Mobile (out of MVP scope):** Basic read-only board view. Full mobile app deferred to post-MVP.
