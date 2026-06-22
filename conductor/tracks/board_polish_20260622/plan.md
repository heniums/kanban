# Implementation Plan: Board Polish & A11y

## Track ID

`board_polish_20260622`

---

## Phase 1: React Compiler Compatibility (FR1)

- [ ] Task: Refactor `new/page.tsx` to use `Controller` for background picker
    - [ ] Write tests: Verify form submits correct value via Controller; verify background picker shows selected swatch
    - [ ] Implement: Replace `watch("background")` + `setValue` with `<Controller name="background" render={({field}) => <BackgroundPicker value={field.value} onChange={field.onChange} />} />`
- [ ] Task: Refactor `board-settings.tsx` to use `Controller` for background picker
    - [ ] Write tests: Same as above
    - [ ] Implement: Same pattern
- [ ] Task: Verify React Compiler warning is gone
    - [ ] Implement: Run `npm run lint --workspace apps/web`; assert 0 RHF warnings
- [ ] Task: Conductor - User Manual Verification 'Phase 1: React Compiler Compatibility'

## Phase 2: Form Input Accessibility (FR2)

- [ ] Task: Add `aria-invalid` and `aria-describedby` to `new/page.tsx` inputs
    - [ ] Write tests: Assert `aria-invalid="true"` and `aria-describedby` are set when errors exist
    - [ ] Implement: Title and description inputs; matching error `<p>` ids
- [ ] Task: Add `aria-invalid` and `aria-describedby` to `board-settings.tsx` inputs
    - [ ] Write tests: Same as above
    - [ ] Implement: Title, description, background picker
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Form Input Accessibility'

## Phase 3: Undo Toast Error Handling (FR3)

- [ ] Task: Wrap undo `onClick` in try/catch with error toast
    - [ ] Write tests: Mock `restoreBoardAction` to throw; assert sonner error toast appears; assert no success toast
    - [ ] Implement: try/catch around restore; `toast.error("Failed to restore board.")` on catch
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Undo Toast Error Handling'

## Phase 4: AlertDialog State Binding (FR4)

- [ ] Task: Bind `AlertDialog` `open` to state and handle errors
    - [ ] Write tests: Assert dialog closes on success; stays open and shows error toast on failure
    - [ ] Implement: `useState` for `open`; `setOpen(false)` in transition success; error toast on failure
- [ ] Task: Conductor - User Manual Verification 'Phase 4: AlertDialog State Binding'

## Phase 5: Race Condition Protection (FR5)

- [ ] Task: Add re-entry guard to `handleDelete`
    - [ ] Write tests: Simulate rapid double-click; assert action called once
    - [ ] Implement: `useState` `inFlight`; early return if true
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Race Condition Protection'

## Phase 6: Text Color on Light Backgrounds (FR6)

- [ ] Task: Create luminance utility
    - [ ] Write tests: Verify `getTextColor(bg)` returns "white" for dark backgrounds, dark color for light backgrounds; handle hex and gradient strings
    - [ ] Implement: Parse hex, compute relative luminance using WCAG formula; return "white" or near-black
- [ ] Task: Use computed text color in `boards/[boardId]/page.tsx`
    - [ ] Write tests: Render board with light background; assert dark text color; render with dark background; assert white text
    - [ ] Implement: `style={{ color: getTextColor(board.background) }}` on title, description, empty state
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Text Color on Light Backgrounds'

## Phase 7: Final Verification

- [ ] Task: Run full gate (lint, typecheck, tests)
    - [ ] Implement: `npm run lint --workspace apps/web` (0 errors, 0 warnings); `npm run typecheck` (no errors); `npm test` (≥ 95 tests pass)
- [ ] Task: Manual a11y check with screen reader / devtools
    - [ ] Implement: Verify AC5
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Final Verification'
