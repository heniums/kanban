# Spec: Decompose CardDetailHeader

## Overview

Refactor the `CardDetailHeader` god component by removing it entirely and inlining its child components directly into the parent (`card-detail.tsx`). The title bar, "in list" subtitle, and metadata fields (due date, labels, assignees) become a flat list of independently rendered components.

## Functional Requirements

1. **Remove `CardDetailHeader`** — Delete `card-detail-header.tsx` and its barrel export. The component no longer exists.
2. **Extract `TitleBar`** — Render `<TitleBar>` directly in `card-detail.tsx`, passing it the same props it currently receives inside `CardDetailHeader` (title, onTitleChange, onCopy, moveTrigger, onDeleteRequest, isPending).
3. **Relocate "in list" subtitle** — Render the "in list …" text directly in `card-detail.tsx` immediately below `<TitleBar>`.
4. **Flatten metadata fields** — Render `<MetadataBar>` directly in `card-detail.tsx` containing the same three `<MetadataField>` children (Due date, Labels, Assignees) with their existing child components (`DueDateField`, `LabelsControl`, `AssigneesControl`).
5. **Keep layout primitives** — `MetadataBar` and `MetadataField` remain as reusable layout components (may be moved to a shared location or kept co-located).
6. **Prop threading** — All props currently passed to `CardDetailHeader` must be threaded to the correct child components from `card-detail.tsx`. No prop may be dropped.

## Non-Functional Requirements

- Zero visual regression — the rendered output must be pixel-identical before and after.
- No new dependencies introduced.
- All existing TypeScript types must remain valid.

## Acceptance Criteria

- [ ] `card-detail-header.tsx` is deleted.
- [ ] `CardDetailHeader` import is removed from `card-detail.tsx`.
- [ ] `TitleBar`, "in list" subtitle, and `MetadataBar` with its fields are rendered directly in `card-detail.tsx`.
- [ ] All existing props (title, labels, assignees, due date, move, copy, delete) are correctly wired.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] Visual output is unchanged (verified manually).

## Out of Scope

- Changing the visual layout or styling of any component.
- Adding new metadata fields.
- Refactoring `TitleBar`, `LabelsControl`, `AssigneesControl`, or `DueDateField` internals.
