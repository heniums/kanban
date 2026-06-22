# Implementation Plan: Board Polish & A11y

## Track ID

`board_polish_20260622`

---

## Phase 1: React Compiler Compatibility (FR1)

- [x] Task: Refactor `new/page.tsx` to use `Controller` for background picker
    - [x] Write tests: Verify form submits correct value via Controller; verify background picker shows selected swatch
    - [x] Implement: Replace `watch("background")` + `setValue` with `<Controller name="background" render={({field}) => <BackgroundPicker value={field.value} onChange={field.onChange} />} />`
- [x] Task: Refactor `board-settings.tsx` to use `Controller` for background picker
    - [x] Write tests: Same as above
    - [x] Implement: Same pattern
- [x] Task: Verify React Compiler warning is gone
    - [x] Implement: Run `npm run lint --workspace apps/web`; assert 0 RHF warnings
- [x] Task: Conductor - User Manual Verification 'Phase 1: React Compiler Compatibility'

## Phase 2: Form Input Accessibility (FR2)

- [x] Task: Add `aria-invalid` and `aria-describedby` to `new/page.tsx` inputs
    - [x] Write tests: Assert `aria-invalid="true"` and `aria-describedby` are set when errors exist
    - [x] Implement: Title and description inputs; matching error `<p>` ids
- [x] Task: Add `aria-invalid` and `aria-describedby` to `board-settings.tsx` inputs
    - [x] Write tests: Same as above
    - [x] Implement: Title, description, background picker
- [x] Task: Conductor - User Manual Verification 'Phase 2: Form Input Accessibility'

## Phase 3: Undo Toast Error Handling (FR3)

- [x] Task: Wrap undo `onClick` in try/catch with error toast
    - [x] Write tests: Mock `restoreBoardAction` to throw; assert sonner error toast appears; assert no success toast
    - [x] Implement: try/catch around restore; `toast.error("Failed to restore board.")` on catch
- [x] Task: Conductor - User Manual Verification 'Phase 3: Undo Toast Error Handling'

## Phase 4: AlertDialog State Binding (FR4)

- [x] Task: Bind `AlertDialog` `open` to state and handle errors
    - [x] Write tests: Assert dialog closes on success; stays open and shows error toast on failure
    - [x] Implement: `useState` for `open`; `setOpen(false)` in transition success; error toast on failure
- [x] Task: Conductor - User Manual Verification 'Phase 4: AlertDialog State Binding'

## Phase 5: Race Condition Protection (FR5)

- [x] Task: Add re-entry guard to `handleDelete`
    - [x] Write tests: Simulate rapid double-click; assert action called once
    - [x] Implement: `useState` `inFlight`; early return if true
- [x] Task: Conductor - User Manual Verification 'Phase 5: Race Condition Protection'

## Phase 6: Text Color on Light Backgrounds (FR6)

- [x] Task: Create luminance utility
    - [x] Write tests: Verify `getTextColor(bg)` returns "white" for dark backgrounds, dark color for light backgrounds; handle hex and gradient strings
    - [x] Implement: Parse hex, compute relative luminance using WCAG formula; return "white" or near-black
- [x] Task: Use computed text color in `boards/[boardId]/page.tsx`
    - [x] Write tests: Render board with light background; assert dark text color; render with dark background; assert white text
    - [x] Implement: `style={{ color: getTextColor(board.background) }}` on title, description, empty state
- [x] Task: Conductor - User Manual Verification 'Phase 6: Text Color on Light Backgrounds'

## Phase 7: Final Verification

- [x] Task: Run full gate (lint, typecheck, tests)
    - [x] Implement: `npm run lint --workspace apps/web` (0 errors, 0 warnings); `npm run typecheck` (no errors); `npm test` (≥ 95 tests pass) — 57/57 tests pass (was 37 baseline; +20 new tests)
- [x] Task: Manual a11y check with screen reader / devtools
    - [x] Implement: Verify AC5
- [x] Task: Conductor - User Manual Verification 'Phase 7: Final Verification'
