# Specification: Card CRUD and Frontend

## Overview

Implement comprehensive card management within kanban board lists. Building on the completed lists track, this track delivers full card lifecycle functionality including creation, editing (inline and detail view), movement across lists, reordering within lists, and deletion. Cards support rich fields beyond MVP scope: title, description, due dates, labels, assignees, checklists, and comments. All card operations synchronize in real-time across connected clients via Socket.io.

## Functional Requirements

### 1. Data Model

- **cards** table:
  - `id`: UUID primary key (default random)
  - `listId`: UUID, not null, foreign key → `lists.id`, cascade delete
  - `boardId`: UUID, not null, foreign key → `boards.id` (denormalized for queries)
  - `title`: text, not null, max 200 characters
  - `description`: text, nullable, max 5000 characters
  - `dueDate`: timestamp, nullable
  - `position`: integer, not null, defines card order within the list
  - `createdAt`: timestamp, default now, not null
  - `updatedAt`: timestamp, default now, auto-update on mutation, not null

- **card_labels** table (many-to-many):
  - `cardId`: UUID, foreign key → `cards.id`, cascade delete
  - `labelId`: UUID, foreign key → `labels.id`, cascade delete
  - Primary key: (`cardId`, `labelId`)

- **labels** table:
  - `id`: UUID primary key
  - `boardId`: UUID, foreign key → `boards.id`, cascade delete
  - `name`: text, not null, max 50 characters
  - `color`: text, not null (hex color code)

- **card_assignees** table (many-to-many):
  - `cardId`: UUID, foreign key → `cards.id`, cascade delete
  - `userId`: UUID, foreign key → `users.id`, cascade delete
  - Primary key: (`cardId`, `userId`)

- **checklists** table:
  - `id`: UUID primary key
  - `cardId`: UUID, foreign key → `cards.id`, cascade delete
  - `title`: text, not null, max 200 characters
  - `position`: integer, not null

- **checklist_items** table:
  - `id`: UUID primary key
  - `checklistId`: UUID, foreign key → `checklists.id`, cascade delete
  - `content`: text, not null, max 500 characters
  - `isCompleted`: boolean, default false
  - `position`: integer, not null

- **comments** table:
  - `id`: UUID primary key
  - `cardId`: UUID, foreign key → `cards.id`, cascade delete
  - `userId`: UUID, foreign key → `users.id`, cascade delete
  - `content`: text, not null, max 2000 characters
  - `createdAt`: timestamp, default now, not null
  - `updatedAt`: timestamp, default now, auto-update on mutation, not null

### 2. Card CRUD Operations (Server Actions)

All operations must verify the requesting user has access to the parent board.

- **createCard**
  - Input: `listId`, `title`, optional `description`, optional `dueDate`, optional `labelIds`, optional `assigneeIds`
  - `position` automatically assigned as `max(existing positions in list) + 1`
  - Returns created card with all relations

- **updateCard**
  - Input: `cardId`, any of: `title`, `description`, `dueDate`, `listId`, `labelIds`, `assigneeIds`
  - Partial update - only provided fields are modified
  - Returns updated card with all relations

- **deleteCard**
  - Input: `cardId`
  - Hard-deletes card and recompacts positions within the list
  - Returns success/failure

- **moveCard**
  - Input: `cardId`, `targetListId`, `targetPosition`
  - Moves card to different list and/or position
  - Recompacts positions in source and target lists
  - Returns updated card

- **reorderCards**
  - Input: `listId`, ordered array of `cardId`s
  - Bulk-updates positions to match provided order
  - Returns reordered cards

### 3. Checklist Operations (Server Actions)

- **createChecklist**: Input `cardId`, `title`, returns checklist
- **updateChecklist**: Input `checklistId`, `title`
- **deleteChecklist**: Input `checklistId`
- **createChecklistItem**: Input `checklistId`, `content`
- **updateChecklistItem**: Input `itemId`, `content`, `isCompleted`
- **deleteChecklistItem**: Input `itemId`

### 4. Comment Operations (Server Actions)

- **createComment**: Input `cardId`, `content`, returns comment with user
- **updateComment**: Input `commentId`, `content` (owner-only)
- **deleteComment**: Input `commentId` (owner-only)
- **getCommentsByCardId**: Input `cardId`, returns paginated comments

### 5. Label Management (Server Actions)

- **createLabel**: Input `boardId`, `name`, `color`
- **updateLabel**: Input `labelId`, `name`, `color`
- **deleteLabel**: Input `labelId`
- **getLabelsByBoardId**: Input `boardId`

### 6. Board Detail Page UI (`/boards/[boardId]`)

- Each list column displays actual cards instead of placeholders
- Cards render as compact cards showing:
  - Title (required, always visible)
  - Due date badge (if set, color-coded: gray=future, yellow=soon, red=overdue)
  - Label chips (if any, colored dots or small pills)
  - Assignee avatars (if any, max 3 shown)
  - Checklist progress (if checklist exists: "3/5" with mini progress bar)
  - Comment count icon (if comments exist)

- **Inline Card Creation:**
  - "Add card" button at bottom of each list
  - Click → inline input field + "Add card" / "Cancel" buttons
  - Enter or click "Add card" → creates card with title only
  - Escape or click "Cancel" → dismisses input
  - New card appears immediately (optimistic UI)

- **Inline Title Editing:**
  - Click card title → inline editable input
  - Enter or blur → saves
  - Escape → cancels

### 7. Card Detail View (Modal/Drawer)

- Clicking a card (outside title edit mode) opens detail view
- Detail view contains:
  - **Header**: Card title (editable), list name, close button
  - **Description**: Rich text area with markdown support
  - **Due Date**: Date picker with clear option
  - **Labels**: Multi-select dropdown with board labels, ability to create new labels inline
  - **Assignees**: User search/selection (registered board members)
  - **Checklists**: Add/remove checklists, add/remove items, check/uncheck items
  - **Comments**: Thread with user avatars, timestamps, edit/delete own comments
  - **Actions**: Move to another list, copy card, delete card (with confirmation)

### 8. Drag-and-Drop

- Use `@dnd-kit/core` and `@dnd-kit/sortable`
- Vertical drag-and-drop within a list to reorder cards
- Horizontal drag-and-drop to move cards between lists
- Optimistic UI: update visually immediately, then call Server Action
- On error: revert to original position
- Keyboard accessible per dnd-kit standards
- Visual feedback: lifted card has shadow, drop targets highlighted

### 9. Real-Time Synchronization

- Socket.io room per board (`board:<boardId>`)
- Events emitted on card mutations:
  - `card:created`, `card:updated`, `card:deleted`
  - `card:moved` (includes source and target list info)
  - `checklist:updated`, `comment:created`
- Clients listen and update local Zustand store accordingly
- Optimistic updates reconciled with server events

### 10. Validation

- `title`: required, 1–200 characters (Zod)
- `description`: optional, max 5000 characters
- `dueDate`: optional, valid ISO date
- All Server Actions validate with Zod before database operations

## Non-Functional Requirements

- **Performance**: Card operations < 200ms; board with 1000 cards loads < 2 seconds
- **Real-Time**: Updates propagate to all users within 100ms
- **Accessibility**: WCAG 2.1 AA; keyboard-navigable DnD; ARIA labels on card actions
- **Responsive**: Cards adapt to list width (min 280px); detail view is fullscreen modal on mobile

## Acceptance Criteria

- [ ] Cards can be created inline within any list
- [ ] Cards display title, due date, labels, assignees, checklist progress, comment count
- [ ] Cards can be edited inline (title) and in detail view (all fields)
- [ ] Cards can be moved between lists via drag-and-drop
- [ ] Cards can be reordered within a list via drag-and-drop
- [ ] Cards can be deleted with confirmation
- [ ] Checklists can be created, edited, and items checked/unchecked
- [ ] Comments can be added, edited, and deleted
- [ ] Labels can be created and assigned to cards
- [ ] Real-time updates sync across all connected clients
- [ ] All CRUD operations protected by board access checks
- [ ] Unit tests cover data layer (≥ 80% coverage)
- [ ] Integration tests cover all Server Actions
- [ ] E2E tests cover create, edit, move, delete, and real-time flows
- [ ] All tests, lint, and typecheck pass

## Out of Scope

- Card attachments/file uploads
- Advanced real-time features (cursor tracking, live cursors)
- Card templates
- Card archiving (soft delete)
- Time tracking / logging
- Advanced search/filtering across cards
- Email notifications for card changes
- Activity feed / audit log for cards
