# Implementation Plan: Board Member Management

## Phase 1: Database Schema & Migrations

- [x] Task: Write tests for board_members table schema and constraints
  - [x] Test that board_members table has correct columns (boardId, userId, role, joinedAt)
  - [x] Test composite primary key constraint (boardId, userId)
  - [x] Test foreign key constraints to boards and users tables
  - [x] Test role enum constraint ('owner', 'member')
  - [x] Test that a board must have at least one owner
  - [x] Test that a user can only be member of a board once

- [x] Task: Create Drizzle migration for board_members table
  - [x] Define boardMembers table schema in Drizzle
  - [x] Add boardId column with foreign key to boards
  - [x] Add userId column with foreign key to users
  - [x] Add role column with enum type ('owner', 'member')
  - [x] Add joinedAt timestamp column
  - [x] Set composite primary key (boardId, userId)
  - [x] Run migration and verify schema

- [x] Task: Update board creation logic to add owner
  - [x] Write tests for auto-adding board creator as owner
  - [x] Modify createBoard server action to insert creator into board_members as 'owner'
  - [x] Verify transaction ensures both board and membership are created atomically

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Migrations' (Protocol in workflow.md)

## Phase 2: Backend Server Actions

- [x] Task: Write tests for permissions system
  - [x] Test ROLE_PERMISSIONS mapping contains correct permissions for each role
  - [x] Test hasPermission returns true when user has the permission
  - [x] Test hasPermission returns false when user lacks the permission
  - [x] Test hasPermission returns false when user is not a board member
  - [x] Test getUserRole returns the correct role for a board member
  - [x] Test getUserRole returns null when user is not a board member

- [x] Task: Implement permissions mapping and utility functions
  - [x] Create permissions.ts with BoardPermission enum type
  - [x] Define ROLE_PERMISSIONS constant mapping roles to permission arrays
  - [x] Implement hasPermission(userId, boardId, permission) utility function
  - [x] Implement getUserRole(userId, boardId) utility function
  - [x] Export permission constants for use in client components

- [x] Task: Write tests for member management server actions
  - [x] Test searchUsers action returns matching users by email/username
  - [x] Test searchUsers excludes existing board members
  - [x] Test addMember action adds user as 'member' role
  - [x] Test addMember fails if user is already a member
  - [x] Test addMember requires manage_members permission
  - [x] Test removeMember action removes user from board
  - [x] Test removeMember fails if user is the last owner
  - [x] Test removeMember requires manage_members permission
  - [x] Test getBoardMembers returns all members with user details

- [x] Task: Implement searchUsers server action
  - [x] Create searchUsers function that queries users by email or username
  - [x] Filter out users who are already members of the board
  - [x] Return user info (id, name, email, username)

- [x] Task: Implement addMember server action
  - [x] Create addMember function that inserts user into board_members
  - [x] Use hasPermission to verify caller has manage_members permission
  - [x] Check user is not already a member
  - [x] Set role to 'member'
  - [x] Return success/error response

- [x] Task: Implement removeMember server action
  - [x] Create removeMember function that deletes user from board_members
  - [x] Use hasPermission to verify caller has manage_members permission
  - [x] Prevent removal if user is the last owner
  - [x] Return success/error response

- [x] Task: Implement getBoardMembers server action
  - [x] Create getBoardMembers function that queries board_members with user details
  - [x] Join with users table to get name, email, username
  - [x] Return array of members with role and joinedAt

- [ ] Task: Update board access control to use permissions
  - [ ] Write tests for permission-based access control
  - [ ] Modify getBoard to verify user has 'view' permission
  - [ ] Return 403/404 if user lacks permission
  - [ ] Update all board-related server actions to use hasPermission checks
  - [ ] Update list and card server actions to check 'edit_content' permission
  - [ ] Update board settings actions to check 'manage_settings' permission

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Server Actions' (Protocol in workflow.md)

## Phase 3: Board Settings Page

- [ ] Task: Write tests for board settings page structure
  - [ ] Test settings page route exists at `/boards/[id]/settings`
  - [ ] Test settings page redirects non-members to dashboard
  - [ ] Test settings page returns 403 for users without manage_settings permission
  - [ ] Test tab navigation between General and Members tabs
  - [ ] Test Settings link appears on board page for users with manage_settings permission

- [ ] Task: Create board settings page route and layout
  - [ ] Create `/boards/[id]/settings/page.tsx` route
  - [ ] Implement permission check (redirect/403 if no manage_settings)
  - [ ] Create tabbed layout with General and Members tabs
  - [ ] Implement tab state management (URL-based or client state)
  - [ ] Add responsive tab navigation

- [ ] Task: Implement General tab (board metadata)
  - [ ] Create GeneralTab component for board settings
  - [ ] Add form fields for board title, description, background
  - [ ] Implement form validation with Zod
  - [ ] Add save button with loading states
  - [ ] Implement updateBoard server action with permission check
  - [ ] Add success/error feedback

- [ ] Task: Implement Members tab (member management)
  - [ ] Write tests for member management components
    - [ ] Test MemberList displays all members with roles
    - [ ] Test AddMemberDialog opens and closes correctly
    - [ ] Test AddMemberDialog search functionality with debounce
    - [ ] Test AddMemberDialog displays search results
    - [ ] Test AddMemberDialog adds member on selection
    - [ ] Test RemoveMemberDialog shows confirmation
    - [ ] Test RemoveMemberDialog removes member on confirm
  - [ ] Implement MemberList component
    - [ ] Create MemberList component that displays board members
    - [ ] Show member name, email/username, role, and join date
    - [ ] Display owner badge for owner role
    - [ ] Show remove button only if current user has manage_members permission (not for self-removal)
  - [ ] Implement AddMemberDialog component
    - [ ] Create AddMemberDialog with search input
    - [ ] Implement debounced search (300ms delay)
    - [ ] Display search results with user info
    - [ ] Handle add member action on user selection
    - [ ] Show loading states and error messages
    - [ ] Close dialog on successful add
  - [ ] Implement RemoveMemberDialog component
    - [ ] Create RemoveMemberDialog with confirmation message
    - [ ] Display member name being removed
    - [ ] Handle remove member action on confirm
    - [ ] Show loading states and error messages
    - [ ] Close dialog on successful remove
  - [ ] Integrate member management components into Members tab
    - [ ] Display MemberList
    - [ ] Add "Add Member" button (only if user has manage_members permission)
    - [ ] Wire up AddMemberDialog and RemoveMemberDialog

- [ ] Task: Add Settings link to board page
  - [ ] Add "Settings" button/link to board page header
  - [ ] Show Settings link only if user has manage_settings permission
  - [ ] Link to `/boards/[id]/settings`
  - [ ] Style consistently with existing header actions

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Board Settings Page' (Protocol in workflow.md)

## Phase 4: Real-Time Updates

- [ ] Task: Write tests for real-time member events
  - [ ] Test member:added event broadcasts to board room
  - [ ] Test member:removed event broadcasts to board room
  - [ ] Test client receives and updates member list on events
  - [ ] Test removed member is redirected if viewing board

- [ ] Task: Implement Socket.io events for member management
  - [ ] Emit member:added event when addMember succeeds
  - [ ] Emit member:removed event when removeMember succeeds
  - [ ] Include updated member list in event payload
  - [ ] Broadcast to board room

- [ ] Task: Update client to handle member events
  - [ ] Listen for member:added event in board page and settings page
  - [ ] Update member list state on event (settings page Members tab)
  - [ ] Listen for member:removed event in board page and settings page
  - [ ] Update member list state on event (settings page Members tab)
  - [ ] Redirect to dashboard if current user was removed (from any page)

- [ ] Task: Conductor - User Manual Verification 'Phase 4: Real-Time Updates' (Protocol in workflow.md)

## Phase 5: Dashboard Integration

- [ ] Task: Write tests for dashboard membership queries
  - [ ] Test dashboard returns boards user owns
  - [ ] Test dashboard returns boards user is member of
  - [ ] Test dashboard excludes boards user is not member of
  - [ ] Test "My Boards" section shows owned boards
  - [ ] Test "Shared with me" section shows member boards

- [ ] Task: Update dashboard queries to include membership
  - [ ] Modify getBoards to query board_members table
  - [ ] Return boards where user is owner OR member
  - [ ] Separate owned boards from member boards in response

- [ ] Task: Update dashboard UI to show membership boards
  - [ ] Display "My Boards" section with owned boards
  - [ ] Display "Shared with me" section with member boards
  - [ ] Show member role badge on shared boards
  - [ ] Update board cards to reflect membership

- [ ] Task: Conductor - User Manual Verification 'Phase 5: Dashboard Integration' (Protocol in workflow.md)
