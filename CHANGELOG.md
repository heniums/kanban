# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-07-12

### Performance

- **Database indexes** — Added indexes for frequently queried foreign-key columns across boards, cards, checklists, checklist items, comments, labels, and attachments
- **Connection pooling** — Configured the database connection pool with slow-query instrumentation
- **JWT callback** — Stopped running `getUserById` on every JWT callback invocation
- **Mutation fetches** — Eliminated redundant post-mutation fetches in card, checklist, and comment actions; fixed a `cardId` bug in checklist mutations
- **Batched inserts** — Batched label and assignee inserts and fixed an N+1 query in `deleteList`
- **Bulk updates** — Consolidated sequential `UPDATE` loops into bulk operations in `moveCard`, `reorderCards`, and `reorderLists`
- **Board page queries** — Parallelized board page queries and narrowed card column selection

## [1.2.0] - 2026-07-09

### Added

- **Custom favicon** — Updated application favicon

### Fixed

- **Card drag-and-drop reliability** — Resolved multiple drag-and-drop issues including unique constraint violations when moving cards between lists, stale `orderedIds` bug during same-list reorder, and native image drag interference on card attachment previews
- **Sortable item collision detection** — Added data type metadata to sortable items to prevent incorrect drop targets (e.g. cards dropping on lists)

## [1.1.0] - 2026-07-08

### Added

- **Trash view** — Dedicated page for deleted boards with restore and permanent delete actions
- **Permanent deletion** — Permanently delete boards with Cloudinary asset cleanup
- **Deleted boards search** — Filter deleted boards by title
- **Deleted boards pagination** — Paginated view for managing multiple deleted boards
- **Delete confirmation countdown** — 5-second countdown before enabling permanent delete button

### Fixed

- **Board deletion undo** — Restored broken undo functionality for soft-deleted boards

### Changed

- **Board query separation** — Separate queries for active and deleted boards

## [1.0.0] - 2026-07-08

Initial release of the Kanban Collaboration Platform.

### Features

- **User authentication** — Registration, login, and session management with NextAuth.js v5
- **Board CRUD** — Create, edit, soft-delete (with 5s undo), and manage boards; each board owned by its creator
- **Dashboard** — Role-aware root route with marketing landing, first-run empty state, and dashboard home with recent boards grid
- **Lists** — Create, rename, delete, and reorder lists within a board
- **Cards** — Create, edit title/description, move across lists, reorder, and delete cards
- **Label management** — Create, edit, delete labels with color palette and search/filter
- **Card assignees** — Assign team members to cards
- **Image attachments** — Cloudinary-powered image uploads for cards, user avatars, and board backgrounds
- **Board member management** — Invite registered users to boards with owner + member role model
- **Real-time collaboration** — Instant synchronization via Socket.io rooms with optimistic UI updates
- **Drag-and-drop** — Accessible, keyboard-native DnD with dnd-kit and spring animations
- **Responsive design** — Desktop and tablet friendly interface with WCAG 2.1 AA accessibility targets
- **Board hero** — Top hero section with background, title, description, and actions
- **Component architecture** — Composable component patterns for card detail and board cards

[1.3.0]: https://github.com/heniums/kanban/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/heniums/kanban/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/heniums/kanban/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/heniums/kanban/releases/tag/v1.0.0
