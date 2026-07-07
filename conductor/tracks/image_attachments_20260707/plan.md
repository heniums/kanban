# Implementation Plan: Image Attachment Support

## Phase 1: Foundation & Data Layer

### 1.1 Database Schema Migration

- [x] Task: Create `attachments` table with all fields (publicId, url, format, width, height, bytes, resourceType, createdBy, createdAt)
- [x] Task: Create `cardAttachments` junction table (cardId, attachmentId, displayOrder) with unique constraint and cascade deletes
- [x] Task: Add `backgroundImageUrl` and `backgroundImagePublicId` columns to `boards` table
- [x] Task: Add `avatarPublicId` column to `users` table
- [x] Task: Generate and run Drizzle migration
- [x] Task: Write tests for schema integrity (foreign key constraints, cascade behavior)
- [x] Task: Commit schema changes

### 1.2 Cloudinary Configuration & Types

- [x] Task: Install `cloudinary` npm package
- [x] Task: Create `src/lib/cloudinary/config.ts` with environment variable validation (Zod schema)
- [x] Task: Create server-side signature generation utility for secure uploads
- [x] Task: Define TypeScript types for Cloudinary upload result and attachment metadata
- [x] Task: Write tests for config validation and signature generation
- [x] Task: Commit Cloudinary config

### 1.3 Attachment Data Layer

- [x] Task: Create `src/lib/data/attachments.ts` with CRUD operations:
  - `createAttachment` — insert into `attachments` table after upload
  - `deleteAttachment` — delete by id (returns publicId for Cloudinary cleanup)
  - `listAttachmentsByCardId` — fetch via `cardAttachments` join
  - `attachImageToCard` — insert into `cardAttachments`
  - `detachImageFromCard` — delete from `cardAttachments`
- [x] Task: Write integration tests for attachment data layer
- [x] Task: Verify all tests pass
- [x] Task: Commit data layer

- [x] Task: Conductor - User Manual Verification 'Foundation & Data Layer' (Protocol in workflow.md)

## Phase 2: Server Actions

### 2.1 Attachment Server Actions

- [x] Task: Create `src/lib/actions/attachments.ts` with:
  - `createAttachmentAction` — Zod validation, auth check, call data layer
  - `deleteAttachmentAction` — auth check, verify user owns attachment or is board member, call Cloudinary API to destroy, then delete from DB
  - `listCardAttachmentsAction` — auth check, return attachments for card
- [x] Task: Write tests for attachment Server Actions (auth, validation, Cloudinary cleanup)
- [x] Task: Verify all tests pass
- [x] Task: Commit attachment actions

### 2.2 Avatar Server Actions

- [x] Task: Create `src/lib/actions/avatar.ts` with:
  - `updateUserAvatarAction` — update user's avatarUrl + avatarPublicId
  - `deleteUserAvatarAction` — clear avatar fields + delete old asset from Cloudinary
- [x] Task: Write tests for avatar Server Actions
- [x] Task: Verify all tests pass
- [x] Task: Commit avatar actions

### 2.3 Board Background Server Actions

- [x] Task: Create `src/lib/actions/board-background.ts` with:
  - `updateBoardBackgroundImageAction` — update board background image (verify board ownership)
  - `deleteBoardBackgroundImageAction` — clear background image fields + delete old asset
- [x] Task: Write tests for board background Server Actions
- [x] Task: Verify all tests pass
- [x] Task: Commit board background actions

- [x] Task: Conductor - User Manual Verification 'Server Actions' (Protocol in workflow.md)

## Phase 3: Card Attachments UI

### 3.1 Cloudinary Upload Widget Integration

- [x] Task: Create `src/components/upload/image-upload.tsx` — drag-and-drop + click-to-upload component
- [x] Task: Implement signed upload flow (fetch signature from server action, upload to Cloudinary)
- [x] Task: Handle upload completion callback to call `createAttachmentAction`
- [x] Task: Handle upload error states and user feedback
- [x] Task: Write component tests for upload widget integration
- [x] Task: Verify all tests pass
- [x] Task: Commit widget integration

### 3.2 Card Detail Attachment Gallery

- [x] Task: Create `src/components/cards/card-detail/card-detail-attachments.tsx` — responsive grid display of card attachments
- [x] Task: Implement image click to open modal viewer with zoom controls
- [x] Task: Implement delete button with confirmation dialog (calls `deleteAttachmentAction`)
- [x] Task: Integrate gallery into card detail modal below description
- [x] Task: Add "Upload Image" area using `ImageUpload` component
- [x] Task: Write component tests for gallery (render, delete, empty state)
- [x] Task: Verify all tests pass
- [x] Task: Commit attachment gallery

- [x] Task: Conductor - User Manual Verification 'Card Attachments UI' (Protocol in workflow.md)

## Phase 4: Avatars & Board Backgrounds UI

### 4.1 Avatar Upload & Display

- [x] Task: Create `src/components/user/avatar-upload.tsx` — upload button using Cloudinary Widget
- [x] Task: Update `src/components/header.tsx` to display avatar image with fallback to initials
- [x] Task: Integrate avatar upload into user dropdown menu
- [x] Task: Add remove avatar option in dropdown
- [x] Task: Write component tests for avatar component
- [x] Task: Verify all tests pass
- [x] Task: Commit avatar UI

### 4.2 Board Background Image UI

- [x] Task: Update `src/components/boards/background-picker.tsx` to include background image upload with auto-open file dialog
- [x] Task: Create preview of board hero with uploaded background
- [x] Task: Update `src/components/boards/board-hero.tsx` to render background image when present (fall back to color)
- [x] Task: Update `BoardSettings` to call `updateBoardBackgroundImageAction` and `deleteBoardBackgroundImageAction`
- [x] Task: Write component tests for board background rendering
- [x] Task: Verify all tests pass
- [x] Task: Commit board background UI

- [x] Task: Conductor - User Manual Verification 'Avatars & Board Backgrounds UI' (Protocol in workflow.md)

## Phase 5: Comment Inline Images

### 5.1 Comment Markdown Parser & Renderer

- [x] Task: Create inline parser in `card-detail-comments.tsx` — detect `![image](url)` syntax
- [x] Task: Render comment text with inline image thumbnails
- [x] Task: Support paste image directly into comment composer (auto-upload + create attachment)
- [x] Task: Click inline images to open image viewer modal
- [x] Task: Write component tests for rendered comments with inline images
- [x] Task: Verify all tests pass
- [x] Task: Commit comment renderer

- [x] Task: Conductor - User Manual Verification 'Comment Inline Images' (Protocol in workflow.md)

## Phase 6: Profile Settings Page

### 6.1 Profile Page & Tabs

- [x] Task: Create `/app/profile/page.tsx` — dedicated profile settings page
- [x] Task: Create `src/components/profile/profile-settings.tsx` with tabs:
  - Profile Info tab: editable display name (email read-only)
  - Avatar tab: upload/remove avatar with preview
  - Password tab: old password + new password + confirm mechanic
- [x] Task: Add `updateUserProfile` and `updateUserPassword` data layer functions
- [x] Task: Create `src/lib/actions/profile.ts` with `updateProfileAction` and `updatePasswordAction`
- [x] Task: Write tests for profile server actions
- [x] Task: Add "Profile Settings" link to header user dropdown
- [x] Task: Verify all tests pass
- [x] Task: Commit profile settings page

- [x] Task: Conductor - User Manual Verification 'Profile Settings Page' (Protocol in workflow.md)

## Phase 7: Image Viewer Modal & UX Polish

### 7.1 Image Viewer Modal

- [x] Task: Create `src/components/upload/image-viewer-modal.tsx` with:
  - Full-size image display on dark overlay
  - Zoom in/out controls (0.5x to 3x)
  - Double-click to zoom toggle
  - Delete button with confirmation AlertDialog
  - Close button
- [x] Task: Integrate viewer into `CardDetailAttachments` (click thumbnail to open)
- [x] Task: Integrate viewer into `CommentItem` (click inline image to open)
- [x] Task: Verify all tests pass
- [x] Task: Commit image viewer modal

### 7.2 Delete Confirmation for Attachments

- [x] Task: Add AlertDialog confirmation before deleting attachment from card detail gallery
- [x] Task: Add AlertDialog confirmation before deleting attachment from image viewer modal
- [x] Task: Verify all tests pass
- [x] Task: Commit delete confirmations

### 7.3 Background Picker Upload Fix

- [x] Task: Fix `BackgroundPicker` image upload to auto-open file dialog on button click
- [x] Task: Add `autoOpen` and `onCancel` props to `ImageUpload` component
- [x] Task: Handle file dialog cancellation (reset UI state)
- [x] Task: Verify all tests pass
- [x] Task: Commit background picker fix

## Phase 8: Integration & Configuration

### 8.1 Next.js & Environment Configuration

- [x] Task: Update `next.config.ts` to add Cloudinary domain to `images.remotePatterns`
- [x] Task: Update `.env.example` with all required Cloudinary environment variables
- [x] Task: Create `.env` entries for Cloudinary credentials (user to fill in actual values)
- [x] Task: Verify Next.js Image component works with Cloudinary URLs
- [x] Task: Commit configuration

### 8.2 Integration Testing & Manual Verification

- [x] Task: Write integration test verifying full upload flow (widget -> DB -> render)
- [x] Task: Write integration test verifying avatar update and display
- [x] Task: Write integration test verifying board background update
- [x] Task: Run full test suite: `npm test`
- [x] Task: Run typecheck: `npm run typecheck`
- [x] Task: Run lint: `npm run lint`
- [x] Task: Manual verification: upload card attachment, verify display, delete, verify removal
- [x] Task: Manual verification: upload avatar, verify display in nav and comments
- [x] Task: Manual verification: upload board background, verify hero rendering
- [x] Task: Manual verification: add inline image reference to comment, verify rendering
- [x] Task: Commit integration tests and fixes

- [x] Task: Conductor - User Manual Verification 'Integration & Configuration' (Protocol in workflow.md)

## Phase 9: Cleanup & Final Review

### 9.1 Documentation & Final Checks

- [ ] Task: Update `README.md` with Cloudinary setup instructions
- [ ] Task: Verify all acceptance criteria from spec.md are met
- [ ] Task: Final test suite run
- [ ] Task: Final typecheck and lint
- [ ] Task: Commit final review changes

- [ ] Task: Conductor - User Manual Verification 'Cleanup & Final Review' (Protocol in workflow.md)
