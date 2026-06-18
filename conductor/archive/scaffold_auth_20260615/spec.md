# Specification: Project Scaffold & Authentication

## Track ID

`scaffold_auth_20260615`

## Goal

Initialize the full-stack project with Next.js, Express.js (with Socket.io scaffolding), Neon PostgreSQL via Drizzle ORM, and implement user authentication (registration, login, session management) with NextAuth.js.

## Functional Requirements

### FR-1: Project Initialization

- Next.js 14 project with App Router and TypeScript
- Express.js backend with TypeScript, separate from Next.js
- Shared TypeScript types package
- ESLint, Prettier, and Husky pre-commit hooks configured
- Tailwind CSS and shadcn/ui installed and configured
- Bun as the package manager

### FR-2: Database Setup

- Neon (serverless PostgreSQL) connection configured via environment variables
- Drizzle ORM initialized with `@neondatabase/serverless` driver
- Users table: id, email (unique), password_hash, name, avatar_url, created_at, updated_at
- Database migration tooling set up (drizzle-kit)

### FR-3: User Registration

- Registration form with email, password, and name
- Password hashing with bcrypt
- Server-side validation with Zod
- Duplicate email detection with user-friendly error
- Successful registration creates user and starts session

### FR-4: User Login

- Login form with email and password
- Credential validation against hashed password
- Session creation via NextAuth.js
- Error handling for invalid credentials

### FR-5: Session Management

- Protected routes redirect unauthenticated users to login
- Session available in both client and server components
- Logout clears session
- Auth state accessible via React context/hook

### FR-6: Basic Application Shell

- App layout with header (logo, user menu, logout)
- Login page
- Registration page
- Empty dashboard page (placeholder for boards)

## Non-Functional Requirements

### NFR-1: Type Safety

- Full TypeScript strict mode
- Shared Zod schemas for API validation

### NFR-2: Security

- Passwords hashed with bcrypt (12 rounds)
- Sessions use HTTP-only cookies
- CSRF protection via NextAuth.js
- No secrets committed to repository

### NFR-3: Developer Experience

- Hot reload for both frontend and backend
- Clear project structure following code style guide
- Environment variable template (.env.example)

## Out of Scope

- OAuth providers (Google, GitHub) — deferred
- Email verification
- Password reset
- Multi-organization support (DB schema deferred)
- Socket.io real-time features (server scaffolding only)
