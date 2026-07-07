# Implementation Plan: Image Attachment Support

## Phase 1: Foundation & Data Layer

### 1.1 Database Schema Migration

- [ ] Task: Create `attachments` table with all fields (publicId, url, format, width, height, bytes, resourceType, createdBy, createdAt)
- [ ] Task: Create `cardAttachments` junction table (cardId, attachmentId, displayOrder) with unique constraint and cascade deletes
- [ ] Task: Add `backgroundImageUrl` and `backgroundImagePublicId` columns to `boards` table
- [ ] Task: Add `avatarPublicId` column to `users` table
- [ ] Task: Generate and run Drizzle migration
- [ ] Task: Write tests for schema integrity (foreign key constraints, cascade behavior)
- [ ] Task: Commit schema changes

### 1.2 Cloudinary Configuration & Types

- [ ] Task: Install `cloudinary` npm package
- [ ] Task: Create `src/lib/cloudinary/config.ts` with environment variable validation (Zod schema)
- [ ] Task: Create server-side signature generation utility for secure uploads
- [ ] Task: Define TypeScript types for Cloudinary upload result and attachment metadata
- [ ] Task: Write tests for config validation and signature generation
- [ ] Task: Commit Cloudinary config

### 1.3 Attachment Data Layer

- [ ] Task: Create `src/lib/data/attachments.ts` with CRUD operations:
  - `createAttachment` — insert into `attachments` table after upload
  - `deleteAttachment` — delete by id (returns publicId for Cloudinary cleanup)
  - `listAttachmentsByCardId` — fetch via `cardAttachments` join
  - `attachImageToCard` — insert into `cardAttachments`
  - `detachImageFromCard` — delete from `cardAttachments`
- [ ] Task: Write integration tests for attachment data layer
- [ ] Task: Verify all tests pass
- [ ] Task: Commit data layer

- [ ] Task: Conductor - User Manual Verification 'Foundation & Data Layer' (Protocol in workflow.md)

## Phase 2: Server Actions

### 2.1 Attachment Server Actions

- [ ] Task: Create `src/lib/actions/attachments.ts` with:
  - `createAttachmentAction` — Zod validation, auth check, call data layer
  - `deleteAttachmentAction` — auth check, verify user owns attachment or is board member, call Cloudinary API to destroy, then delete from DB
  - `listCardAttachmentsAction` — auth check, return attachments for card
- [ ] Task: Write tests for attachment Server Actions (auth, validation, Cloudinary cleanup)
- [ ] Task: Verify all tests pass
- [ ] Task: Commit attachment actions

### 2.2 Avatar Server Actions

- [ ] Task: Create `src/lib/actions/avatar.ts` with:
  - `updateUserAvatarAction` — update user's avatarUrl + avatarPublicId
  - `deleteUserAvatarAction` — clear avatar fields + delete old asset from Cloudinary
- [ ] Task: Write tests for avatar Server Actions
- [ ] Task: Verify all tests pass
- [ ] Task: Commit avatar actions

### 2.3 Board Background Server Actions

- [ ] Task: Create `src/lib/actions/board-background.ts` with:
  - `updateBoardBackgroundImageAction` — update board background image (verify board ownership)
  - `deleteBoardBackgroundImageAction` — clear background image fields + delete old asset
- [ ] Task: Write tests for board background Server Actions
- [ ] Task: Verify all tests pass
- [ ] Task: Commit board background actions

- [ ] Task: Conductor - User Manual Verification 'Server Actions' (Protocol in workflow.md)

## Phase 3: Card Attachments UI

### 3.1 Cloudinary Upload Widget Integration

- [ ] Task: Create `src/components/cloudinary/upload-widget.tsx` — React component wrapping Cloudinary Upload Widget
- [ ] Task: Implement signed upload flow (fetch signature from server action, then open widget)
- [ ] Task: Handle upload completion callback to call `createAttachmentAction` + `attachImageToCardAction`
- [ ] Task: Handle upload error states and user feedback
- [ ] Task: Write component tests for upload widget integration
- [ ] Task: Verify all tests pass
- [ ] Task: Commit widget integration

### 3.2 Card Detail Attachment Gallery

- [ ] Task: Create `src/components/cards/attachment-gallery.tsx` — responsive grid display of card attachments
- [ ] Task: Implement image click to expand/lightbox view
- [ ] Task: Implement delete button with confirmation (calls `deleteAttachmentAction`)
- [ ] Task: Integrate gallery into card detail modal below description
- [ ] Task: Add "Upload Image" button that opens the Cloudinary Upload Widget
- [ ] Task: Write component tests for gallery (render, delete, empty state)
- [ ] Task: Verify all tests pass
- [ ] Task: Commit attachment gallery

- [ ] Task: Conductor - User Manual Verification 'Card Attachments UI' (Protocol in workflow.md)

## Phase 4: Avatars & Board Backgrounds UI

### 4.1 Avatar Upload & Display

- [ ] Task: Create `src/components/user/avatar-upload.tsx` — upload button using Cloudinary Widget
- [ ] Task: Update `src/components/user/user-avatar.tsx` (or create) to display avatar image with Cloudinary transformations (w=40, h=40, crop=fill)
- [ ] Task: Integrate avatar upload into user dropdown menu or navigation
- [ ] Task: Add fallback to initials-based avatar when no image (use existing shadcn/ui avatar component)
- [ ] Task: Replace all user name display locations with avatar component:
  - Navigation user dropdown
  - Board member sharing modal
  - Card detail assignees list
  - Comment author indicator
- [ ] Task: Write component tests for avatar component
- [ ] Task: Verify all tests pass
- [ ] Task: Commit avatar UI

### 4.2 Board Background Image UI

- [ ] Task: Update board edit modal to include background image upload section
- [ ] Task: Create preview of board hero with uploaded background
- [ ] Task: Update board hero component to render background image when present (fall back to color)
- [ ] Task: Update dashboard board card to show background image in compact hero
- [ ] Task: Write component tests for board background rendering
- [ ] Task: Verify all tests pass
- [ ] Task: Commit board background UI

- [ ] Task: Conductor - User Manual Verification 'Avatars & Board Backgrounds UI' (Protocol in workflow.md)

## Phase 5: Comment Inline Images

### 5.1 Comment Markdown Parser & Renderer

- [ ] Task: Create `src/lib/comments/markdown.ts` — simple parser to detect `![image](attachment_id)` syntax
- [ ] Task: Create `src/components/comments/comment-content.tsx` — render comment text with inline image thumbnails
- [ ] Task: Handle invalid/deleted attachment references gracefully (show placeholder text)
- [ ] Task: Write unit tests for markdown parser
- [ ] Task: Write component tests for rendered comments with inline images
- [ ] Task: Verify all tests pass
- [ ] Task: Commit comment renderer

### 5.2 Comment Composer Attachment Picker

- [ ] Task: Add attachment picker button to comment composer toolbar
- [ ] Task: Create dropdown/popover listing card's current attachments with thumbnails
- [ ] Task: Insert `![image](attachment_id)` markdown at cursor position when attachment selected
- [ ] Task: Write component tests for attachment picker
- [ ] Task: Verify all tests pass
- [ ] Task: Commit composer picker

- [ ] Task: Conductor - User Manual Verification 'Comment Inline Images' (Protocol in workflow.md)

## Phase 6: Integration & Configuration

### 6.1 Next.js & Environment Configuration

- [ ] Task: Update `next.config.ts` to add Cloudinary domain to `images.remotePatterns`
- [ ] Task: Update `.env.example` with all required Cloudinary environment variables
- [ ] Task: Create `.env` entries for Cloudinary credentials (user to fill in actual values)
- [ ] Task: Verify Next.js Image component works with Cloudinary URLs
- [ ] Task: Commit configuration

### 6.2 Integration Testing & Manual Verification

- [ ] Task: Write integration test verifying full upload flow (widget -> DB -> render)
- [ ] Task: Write integration test verifying avatar update and display
- [ ] Task: Write integration test verifying board background update
- [ ] Task: Run full test suite: `npm test`
- [ ] Task: Run typecheck: `npm run typecheck`
- [ ] Task: Run lint: `npm run lint`
- [ ] Task: Manual verification: upload card attachment, verify display, delete, verify removal
- [ ] Task: Manual verification: upload avatar, verify display in nav and comments
- [ ] Task: Manual verification: upload board background, verify hero rendering
- [ ] Task: Manual verification: add inline image reference to comment, verify rendering
- [ ] Task: Commit integration tests and fixes

- [ ] Task: Conductor - User Manual Verification 'Integration & Configuration' (Protocol in workflow.md)

## Phase 7: Cleanup & Final Review

### 7.1 Documentation & Final Checks

- [ ] Task: Update `README.md` with Cloudinary setup instructions
- [ ] Task: Verify all acceptance criteria from spec.md are met
- [ ] Task: Final test suite run
- [ ] Task: Final typecheck and lint
- [ ] Task: Commit final review changes

- [ ] Task: Conductor - User Manual Verification 'Cleanup & Final Review' (Protocol in workflow.md)
