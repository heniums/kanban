# Specification: Image Attachment Support

## Overview

Add image upload and management capabilities across the kanban application using Cloudinary as the image storage and CDN provider. This feature covers four areas: card attachments, user avatars, board background images, and inline image references in card comments.

## Scope

### In Scope

1. **Card Image Attachments**
   - Upload images to cards via drag-and-drop or click-to-upload
   - Display uploaded images in a gallery/grid within the card detail modal
   - Click attachment image to open modal viewer with zoom controls
   - Delete individual attachments with confirmation dialog (removes from Cloudinary + DB)
   - Maximum 10 images per card, 5MB per image
   - Supported formats: JPEG, PNG, WebP, GIF

2. **User Avatar Upload & Profile Settings**
   - Upload profile picture via Cloudinary Upload Widget
   - Display avatar in user dropdown, board member list, card assignees, and comments
   - Replace existing avatar (delete old from Cloudinary)
   - Fallback to initials-based avatar when no image uploaded
   - Dedicated `/profile` settings page with tabs:
     - Profile Info tab: update display name (email read-only)
     - Avatar tab: upload/remove avatar with preview
     - Password tab: update password via old/new password mechanic
   - Maximum 2MB, image formats only

3. **Board Background Images**
   - Upload a cover/background image for the board hero section via direct file picker
   - Display as background behind the board title/description on both board page and dashboard card
   - Falls back to existing color-based `background` field when no image set
   - Replace/delete background image
   - Maximum 5MB, recommended 16:9 aspect ratio

4. **Comment Inline Image References**
   - Paste images directly into comment composer (auto-upload to Cloudinary + create attachment)
   - Support markdown-like syntax `![image](url)` in comment text
   - Render referenced card attachment images inline when displaying comments
   - Click inline images to open image viewer modal
   - Gracefully handle invalid or deleted attachment references

### Data Model Changes

#### New Tables

**`attachments`**

- `id` (uuid, PK)
- `publicId` (text, not null, unique) — Cloudinary public_id
- `url` (text, not null) — Cloudinary delivery URL
- `format` (text) — jpg, png, webp, gif
- `width` (integer)
- `height` (integer)
- `bytes` (integer) — file size
- `resourceType` (text) — "image"
- `createdBy` (uuid, FK -> users.id)
- `createdAt` (timestamp)

**`cardAttachments`**

- `id` (uuid, PK)
- `cardId` (uuid, FK -> cards.id, onDelete: cascade)
- `attachmentId` (uuid, FK -> attachments.id, onDelete: cascade)
- `displayOrder` (integer)
- Unique constraint on (cardId, attachmentId)

#### Modified Tables

**`boards`**

- Add `backgroundImageUrl` (text, nullable)
- Add `backgroundImagePublicId` (text, nullable)

**`users`**

- Add `avatarPublicId` (text, nullable) — for Cloudinary cleanup on replace/delete

### API / Server Actions

1. **Cloudinary Configuration**
   - Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - Server-side signature generation for secure direct upload
   - Upload preset configuration (unsigned or signed)

2. **Attachment Server Actions**
   - `createAttachment` — called after successful Cloudinary upload to persist metadata
   - `deleteAttachment` — remove from DB + delete from Cloudinary via API
   - `listCardAttachments` — fetch attachments for a card
   - `attachImageToCard` — link existing attachment to card
   - `detachImageFromCard` — remove link (keep attachment in DB for potential reuse)

3. **Avatar Server Actions**
   - `updateUserAvatar` — update user's avatarUrl + avatarPublicId
   - `deleteUserAvatar` — remove avatar (clear fields + delete old asset from Cloudinary)

4. **Board Background Server Actions**
   - `updateBoardBackgroundImage` — update board's background image (verify board ownership)
   - `deleteBoardBackgroundImage` — remove background image (revert to color)

### UI/UX

1. **Card Detail Modal**
   - New "Attachments" section below description
   - "Upload Image" button opens Cloudinary Upload Widget
   - Images displayed as responsive grid (2-3 columns)
   - Click to expand/lightbox view
   - Hover shows delete button
   - Upload progress shown by widget

2. **Comment Composer**
   - Toolbar button to insert image reference
   - Dropdown showing card's current attachments with thumbnails
   - Inserted as `![image](attachment_id)` markdown into text area
   - Live preview of rendered comment

3. **User Settings / Profile**
   - Avatar upload button in user menu or settings page
   - Circular crop preview after upload
   - Clear/remove avatar option

4. **Board Settings**
   - Background image upload in board edit modal
   - Preview of how it will look in hero section
   - Remove/change option

5. **Avatar Display Locations**
   - Navigation user dropdown
   - Board member sharing modal
   - Card detail assignees
   - Comment author indicator
   - Use Cloudinary transformations for consistent sizing (w=40, h=40, crop=fill)

### Non-Functional Requirements

- **Performance:** Images served via Cloudinary CDN with automatic format optimization (f_auto, q_auto)
- **Security:** Direct uploads use signed upload or restricted preset; deletions require server-side Cloudinary API auth
- **Type Safety:** All new schemas and APIs fully typed with Zod
- **Cleanup:** Deleting an attachment or replacing an avatar/board background must delete the old Cloudinary asset
- **Accessibility:** Upload widgets and image galleries keyboard accessible; alt text required (use card title or "User avatar" fallback)

### Acceptance Criteria

- [ ] Cloudinary Upload Widget successfully uploads images from browser
- [ ] Uploaded images appear in card detail attachment gallery
- [ ] Deleting an attachment removes it from Cloudinary and database
- [ ] User avatar displays in all relevant UI locations after upload
- [ ] Replacing an avatar deletes the old Cloudinary asset
- [ ] Board background image renders in hero section
- [ ] Removing a board background reverts to color fallback
- [ ] Comment text with `![image](attachment_id)` renders the image inline
- [ ] Invalid attachment references in comments show a broken image placeholder
- [ ] Maximum limits enforced (10 per card, 5MB file size)
- [ ] `npm run typecheck`, `npm run lint`, and `npm test` pass

### Out of Scope

- Video or audio attachments
- Attachment download/exports
- Image editing/cropping beyond Cloudinary widget capabilities
- AI-generated alt text
- Content delivery outside Cloudinary (no S3, no local storage)
- E2E tests for Cloudinary upload flows (requires real Cloudinary account)
- Image analytics/view counts
- Attachment search/indexing
- Multiple file upload in a single widget session (widget supports this natively)

### Environment Variables

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=
```

### References

- Cloudinary Upload Widget documentation: https://cloudinary.com/documentation/upload_widget
- Next.js Image Optimization with remote patterns: https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
