# Changelog

All notable changes to this project will be documented in this file.

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
