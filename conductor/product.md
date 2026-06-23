# Initial Concept

A collaborative kanban board web application for mid-level portfolio. The application should demonstrate real-time collaboration capabilities with multiple boards, organizations, teams, and user management. This is a demonstration project to signal to employers that I can build complex, real-time collaborative applications.

Key characteristics:
- Real-time, collaborative kanban boards
- Multi-organization support
- Team-based access control
- Web-based interface
- Mid-level portfolio project

---

# Product Guide: Kanban Collaboration Platform

## Vision
A real-time collaborative kanban board application designed for medium-sized organizations (10-50 users). The platform enables teams to organize work visually, collaborate in real-time, and manage access through a structured organization-team hierarchy.

## Target Users
- **Primary:** Medium-sized teams and organizations (10-50 members)
- **Secondary:** Individual professionals managing complex projects
- **Use Cases:** Software development, project management, content planning, sprint tracking

## Core Features

### 1. Organization & Team Management
- Organization creation and administration
- Team creation within organizations
- Team-level membership management
- Organization-level settings and branding

### 2. Board Management
- Create, edit, and archive boards
- Board-level permissions (view, edit, admin)
- Board favorites and recent boards list
- Team assignment to boards

### 3. Card & List Management
- Drag-and-drop lists and cards
- Card details: title, description, due dates, labels
- Card assignments to team members
- Card attachments and checklists
- Card comments and activity history

### 4. Real-Time Collaboration
- Instant synchronization of card moves, edits, and new cards
- Real-time updates visible to all active users on a board
- Optimistic UI updates with server reconciliation
- Automatic reconnection on network interruptions

### 5. Permissions & Access Control
- Role-based access: Owner, Admin, Member, Viewer
- Organization-level roles
- Team-level roles
- Board-level permissions
- Public/private board visibility

### 6. Activity & Audit
- Activity feed for boards and cards
- Change history tracking
- Recent activity dashboard
- Email notifications for mentions and assignments

## Non-Functional Requirements
- **Performance:** Sub-100ms real-time updates, responsive UI
- **Capacity:** Support 100+ concurrent users per board
- **Reliability:** Graceful handling of disconnections, automatic reconnection
- **Accessibility:** WCAG 2.1 AA compliance
- **Responsive Design:** Works on desktop and tablet

## Success Metrics
- Users can create a board and start collaborating within 2 minutes
- Real-time updates propagate to all users within 100ms
- Board loads with 1000 cards in under 2 seconds
- Zero data loss during network interruptions

## MVP Scope (v1)

The first MVP delivers the product's core value: a real-time collaborative kanban board. Organizational scaffolding (orgs, teams, role-based permissions) is deferred until boards exist, since those features have no consumers until the core board experience is working. Deferred items are designed to be added later as additive schema migrations (e.g. nullable `orgId`/`teamId` on boards), not rewrites.

### In Scope (MVP v1)
- **User Authentication:** Registration, login, session management (completed in scaffold track)
- **Boards:** Create, open, edit metadata, soft-delete with 5s undo; each board owned by its creator; dashboard with "My Boards" and "Shared with me" sections (completed in board_mgmt track)
- **Dashboard (`/`) Landing:** Role-aware root route — unauthenticated visitors see a marketing landing with "Get started"/"Sign in" CTAs; authenticated users with zero boards see a first-run empty-state funneling to `/boards/new`; authenticated users with ≥1 board see a dashboard home with a "Recent boards" grid (up to 6, sorted by `updatedAt` desc), a "Shared with you" preview, a "Create board" primary button, and a persistent "Go to boards" secondary button linking to `/boards` (completed in dashboard_first_board_onboarding track)
- **Lists:** Create, rename, delete, reorder within a board
- **Cards:** Create, edit title and description, move across lists, reorder within a list, delete
- **Real-Time Collaboration:** Multiple users on the same board see changes live via Socket.io rooms
- **Board Sharing:** Invite other registered users to a board (owner + member, no role tiers)
- **UX:** Optimistic UI updates with server reconciliation; drag-and-drop with dnd-kit (keyboard accessible)

### Deferred to Post-MVP (still in product vision)
- Organization & team management hierarchy
- Role-based access control (Owner, Admin, Member, Viewer) — MVP uses owner + member only
- Team assignment to boards; board archiving; public/private board visibility
- Activity feed & audit history; email notifications for mentions and assignments
- Card checklists, attachments, comments, labels, and due dates
- Board favorites and recent boards list

## Out of Scope (for MVP)
- Mobile native apps
- Advanced reporting and analytics
- Third-party integrations (GitHub, Slack, etc.)
- Offline mode support
- Video/audio chat
- Advanced automation (IFTTT-style rules)
