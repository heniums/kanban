# Specification: Board Member Management

## Overview

Implement board member management for the MVP, allowing board owners to invite registered users to collaborate on their boards. This follows the MVP approach: boards manage their own members directly (no organization/team hierarchy), with a simple Owner + Member role model.

## Functional Requirements

### 1. Data Model

- Add a `board_members` join table with:
  - `boardId`: Foreign key to boards table
  - `userId`: Foreign key to users table
  - `role`: Enum ('owner', 'member')
  - `joinedAt`: Timestamp
  - Composite primary key: (boardId, userId)
- When a board is created, automatically add the creator as an 'owner' in `board_members`
- Add database constraints:
  - A board must have at least one owner
  - A user can only be a member of a board once

### 2. Member Invitation Flow

- Board owners can search for registered users by email or username
- Search results display user info (name, email, username)
- Owner can add selected users as 'member' role
- Added members immediately gain access to the board
- Real-time notification to all board members when a new member is added

### 3. Member Permissions

- **Owner role:**
  - All member permissions
  - Manage board settings (title, description, background, delete board)
  - Manage members (add/remove)
- **Member role:**
  - View the board and all its content
  - Create, edit, move, and delete lists
  - Create, edit, move, and delete cards
  - Cannot access board settings
  - Cannot manage other members

### 4. Member Removal

- Owner can remove any member from the board
- Removed members immediately lose access to the board
- Cards created by removed members remain on the board (not deleted or reassigned)
- Real-time notification to all board members when a member is removed
- Owner cannot remove themselves from their own board

### 5. Member List Display

- Board UI displays a list of current members with their roles
- Members can see who else has access to the board
- Member list shows: name, email/username, role, join date

### 6. Access Control

- Only board members can access the board
- Non-members attempting to access a board receive a 403/404 error
- Board visibility in dashboard respects membership (show boards user owns or is a member of)

## Non-Functional Requirements

- **Performance:** User search should respond within 200ms with debouncing (300ms delay)
- **Real-time:** Member add/remove events propagate to all connected clients within 100ms
- **Security:** All member management actions require proper authorization checks
- **UX:** Clear feedback when adding/removing members (loading states, success/error messages)

## Acceptance Criteria

1. When a user creates a board, they are automatically added as 'owner' in `board_members`
2. Owner can search for registered users by email or username
3. Owner can add found users as 'member' to the board
4. Added members can immediately access the board and see it in their dashboard
5. Members can view and edit all board content (lists, cards)
6. Members cannot access board settings (edit title, description, background, delete)
7. Members cannot add or remove other members
8. Owner can remove members from the board
9. Removed members immediately lose access and are redirected if currently viewing the board
10. Cards created by removed members remain on the board
11. Member list displays all current members with their roles
12. Real-time updates when members are added or removed
13. Dashboard shows boards user owns OR is a member of

## Out of Scope

- Organization and team hierarchy
- Advanced role tiers (Admin, Viewer)
- Email invitation system with accept/decline flow
- Shareable invitation links
- Members leaving boards voluntarily
- Activity history/audit log for member changes
- Email notifications for member additions
- Bulk member operations
- Member search by partial name (only exact email/username match)
