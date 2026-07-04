# Implementation Plan: Board Member Management

## Phase 1: Database Schema & Migrations

- [ ] Task: Write tests for board_members table schema and constraints
  - [ ] Test that board_members table has correct columns (boardId, userId, role, joinedAt)
  - [ ] Test composite primary key constraint (boardId, userId)
  - [ ] Test foreign key constraints to boards and users tables
  - [ ] Test role enum constraint ('owner', 'member')
  - [ ] Test that a board must have at least one owner
  - [ ] Test that a user can only be member of a board once

- [ ] Task: Create Drizzle migration for board_members table
  - [ ] Define boardMembers table schema in Drizzle
  - [ ] Add boardId column with foreign key to boards
  - [ ] Add userId column with foreign key to users
  - [ ] Add role column with enum type ('owner', 'member')
  - [ ] Add joinedAt timestamp column
  - [ ] Set composite primary key (boardId, userId)
  - [ ] Run migration and verify schema

- [ ] Task: Update board creation logic to add owner
  - [ ] Write tests for auto-adding board creator as owner
  - [ ] Modify createBoard server action to insert creator into board_members as 'owner'
  - [ ] Verify transaction ensures both board and membership are created atomically

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & Migrations' (Protocol in workflow.md)

## Phase 2: Backend Server Actions

- [ ] Task: Write tests for permissions system
  - [ ] Test ROLE_PERMISSIONS mapping contains correct permissions for each role
  - [ ] Test hasPermission returns true when user has the permission
  - [ ] Test hasPermission returns false when user lacks the permission
  - [ ] Test hasPermission returns false when user is not a board member
  - [ ] Test getUserRole returns the correct role for a board member
  - [ ] Test getUserRole returns null when user is not a board member

- [ ] Task: Implement permissions mapping and utility functions
  - [ ] Create permissions.ts with BoardPermission enum type
  - [ ] Define ROLE_PERMISSIONS constant mapping roles to permission arrays
  - [ ] Implement hasPermission(userId, boardId, permission) utility function
  - [ ] Implement getUserRole(userId, boardId) utility function
  - [ ] Export permission constants for use in client components

- [ ] Task: Write tests for member management server actions
  - [ ] Test searchUsers action returns matching users by email/username
  - [ ] Test searchUsers excludes existing board members
  - [ ] Test addMember action adds user as 'member' role
  - [ ] Test addMember fails if user is already a member
  - [ ] Test addMember requires manage_members permission
  - [ ] Test removeMember action removes user from board
  - [ ] Test removeMember fails if user is the last owner
  - [ ] Test removeMember requires manage_members permission
  - [ ] Test getBoardMembers returns all members with user details

- [ ] Task: Implement searchUsers server action
  - [ ] Create searchUsers function that queries users by email or username
  - [ ] Filter out users who are already members of the board
  - [ ] Return user info (id, name, email, username)

- [ ] Task: Implement addMember server action
  - [ ] Create addMember function that inserts user into board_members
  - [ ] Use hasPermission to verify caller has manage_members permission
  - [ ] Check user is not already a member
  - [ ] Set role to 'member'
  - [ ] Return success/error response

- [ ] Task: Implement removeMember server action
  - [ ] Create removeMember function that deletes user from board_members
  - [ ] Use hasPermission to verify caller has manage_members permission
  - [ ] Prevent removal if user is the last owner
  - [ ] Return success/error response

- [ ] Task: Implement getBoardMembers server action
  - [ ] Create getBoardMembers function that queries board_members with user details
  - [ ] Join with users table to get name, email, username
  - [ ] Return array of members with role and joinedAt

- [ ] Task: Update board access control to use permissions
  - [ ] Write tests for permission-based access control
  - [ ] Modify getBoard to verify user has 'view' permission
  - [ ] Return 403/404 if user lacks permission
  - [ ] Update all board-related server actions to use hasPermission checks
  - [ ] Update list and card server actions to check 'edit_content' permission
  - [ ] Update board settings actions to check 'manage_settings' permission

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Server Actions' (Protocol in workflow.md)

## Phase 3: Frontend - Member Management UI

- [ ] Task: Write tests for member management components
  - [ ] Test MemberList displays all members with roles
  - [ ] Test AddMemberDialog opens and closes correctly
  - [ ] Test AddMemberDialog search functionality with debounce
  - [ ] Test AddMemberDialog displays search results
  - [ ] Test AddMemberDialog adds member on selection
  - [ ] Test RemoveMemberDialog shows confirmation
  - [ ] Test RemoveMemberDialog removes member on confirm

- [ ] Task: Implement MemberList component
  - [ ] Create MemberList component that displays board members
  - [ ] Show member name, email/username, role, and join date
  - [ ] Display owner badge for owner role
  - [ ] Show remove button only if current user has manage_members permission (not for self-removal)

- [ ] Task: Implement AddMemberDialog component
  - [ ] Create AddMemberDialog with search input
  - [ ] Implement debounced search (300ms delay)
  - [ ] Display search results with user info
  - [ ] Handle add member action on user selection
  - [ ] Show loading states and error messages
  - [ ] Close dialog on successful add

- [ ] Task: Implement RemoveMemberDialog component
  - [ ] Create RemoveMemberDialog with confirmation message
  - [ ] Display member name being removed
  - [ ] Handle remove member action on confirm
  - [ ] Show loading states and error messages
  - [ ] Close dialog on successful remove

- [ ] Task: Integrate member management into board page
  - [ ] Add member management section to board page header
  - [ ] Show MemberList component
  - [ ] Add "Add Member" button (only if user has manage_members permission)
  - [ ] Wire up AddMemberDialog and RemoveMemberDialog
  - [ ] Hide member management controls based on permissions

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend - Member Management UI' (Protocol in workflow.md)

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
  - [ ] Listen for member:added event in board page
  - [ ] Update member list state on event
  - [ ] Listen for member:removed event in board page
  - [ ] Update member list state on event
  - [ ] Redirect to dashboard if current user was removed

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
