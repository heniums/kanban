# Specification: Split Large Files (Refactor)

## Overview

Refactor oversized source files that contain too many responsibilities into smaller, focused modules to improve maintainability, readability, and testability. This is a pure refactoring chore — no functional changes, no new features.

## Scope

### Named Files (Explicitly Requested)

1. **`src/components/cards/card-detail.tsx`** (1623 lines)
   - Create `src/components/cards/card-detail/` directory
   - Extract sub-components into co-located files (e.g., `card-detail-header.tsx`, `card-detail-labels.tsx`, `card-detail-checklist.tsx`, `card-detail-comments.tsx`, etc.)
   - Keep the main `card-detail.tsx` as the orchestrator, delegating to extracted sub-components

2. **`src/lib/data/cards/index.ts`** (408 lines)
   - Split into focused modules (e.g., `queries.ts`, `mutations.ts`, `schemas.ts`, `helpers.ts`)
   - Maintain a barrel `index.ts` re-exporting the public API

3. **`src/lib/data/checklists/`**
   - Split into focused modules following the same pattern as cards

4. **`src/lib/data/comments/`**
   - Split into focused modules following the same pattern as cards

### Discovery (Scan-Driven)

5. **Other files > 300 lines** in `src/` that contain multiple responsibilities
   - Scan the entire `src/` tree during the implementation phase
   - Split any qualifying files following the same co-location pattern

## Splitting Strategy

- **Components**: Extract sub-components into a directory named after the parent, with one file per sub-component. The parent file becomes an orchestrator that composes the extracted pieces.
- **Data layer**: Split by concern — queries (reads), mutations (writes), schemas (validation/types), and helpers (utilities). Each module gets its own file; a barrel `index.ts` re-exports the public API.
- **Threshold**: Files exceeding 300 lines are candidates for splitting.

## Non-Functional Requirements

- No change in behavior, API contracts, or user-facing functionality
- Bundle size should not regress (tree-shaking should handle unused exports)
- Import paths for consumers outside the split modules must remain unchanged (use barrel re-exports)

## Acceptance Criteria

- [ ] All named files are split into modules ≤ 300 lines each
- [ ] All discovered files > 300 lines with multiple responsibilities are split
- [ ] All existing tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Application builds without errors (`npm run build`)
- [ ] No functional regressions — manual smoke test of card detail, cards CRUD, checklists, and comments

## Out of Scope

- Functional changes or new features
- Changing file/folder organization conventions (follows existing project patterns)
- Performance optimizations beyond what splitting naturally provides
- Renaming exports or changing public APIs
