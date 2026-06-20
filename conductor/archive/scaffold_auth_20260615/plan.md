# Implementation Plan: Project Scaffold & Authentication

## Track ID

`scaffold_auth_20260615`

---

## Phase 1: Project Initialization

- [x] Task: Initialize Next.js project with TypeScript and App Router
  - [x] Write tests: Verify project compiles and dev server starts
  - [x] Implement: Create Next.js project, configure tsconfig strict mode, set up App Router structure
- [x] Task: Configure tooling (ESLint, Prettier, Husky)
  - [x] Write tests: Verify lint and format commands pass
  - [x] Implement: Add ESLint with typescript-eslint, Prettier config, Husky pre-commit hook
- [x] Task: Install and configure Tailwind CSS + shadcn/ui
  - [x] Write tests: Verify Tailwind classes compile without errors
  - [x] Implement: Configure tailwind.config.ts, set up shadcn/ui components.json
- [x] Task: Initialize Express.js backend with TypeScript
  - [x] Write tests: Verify Express server starts and responds to health check
  - [x] Implement: Create Express app with TypeScript, add basic middleware (cors, json), tsx for dev
- [x] Task: Set up shared types package and project structure
  - [x] Write tests: Verify shared types are importable from both frontend and backend
  - [x] Implement: Create shared directory with Zod schemas, configure path aliases
- [x] Task: Conductor - User Manual Verification 'Phase 1: Project Initialization' (Protocol in workflow.md)

## Phase 2: Database Setup

- [x] Task: Configure Neon database connection and Drizzle ORM
  - [x] Write tests: Verify database connection succeeds
  - [x] Implement: Set up env vars (DATABASE_URL), drizzle.config.ts, db connection using pg driver
- [x] Task: Define and migrate users table schema
  - [x] Write tests: Verify table creation and column types via Drizzle introspection
  - [x] Implement: Define users schema (id, email, password_hash, name, avatar_url, timestamps), run db:push
- [x] Task: Create seed script for development
  - [x] Write tests: Verify seed script creates a test user without errors
  - [x] Implement: Create seed script with a demo user
- [x] Task: Conductor - User Manual Verification 'Phase 2: Database Setup' (Protocol in workflow.md)

## Phase 3: Authentication

- [x] Task: Implement user registration endpoint 12ff79c
  - [x] Write tests: Test successful registration, duplicate email, invalid input
  - [x] Implement: POST /api/auth/register with Zod validation, bcrypt hashing, user creation
- [x] Task: Configure NextAuth.js with credentials provider a4dc40c
  - [x] Write tests: Verify NextAuth configuration exports correctly
  - [x] Implement: Set up auth.ts with CredentialsProvider, JWT strategy, session callbacks
- [x] Task: Implement login endpoint 9b6ba30
  - [x] Write tests: Test successful login, invalid credentials, missing fields
  - [x] Implement: Wire NextAuth.js signIn, verify password against bcrypt hash, return session
- [x] Task: Build registration page UI 235dad5
  - [x] Write tests: Test form validation, successful registration flow, error display
  - [x] Implement: Registration form component with React Hook Form + Zod, redirect on success
- [x] Task: Build login page UI 235dad5
  - [x] Write tests: Test form validation, successful login flow, error display
  - [x] Implement: Login form component with React Hook Form + Zod, redirect on success
- [x] Task: Implement protected routes and session handling 680cfb4
  - [x] Write tests: Verify unauthenticated user is redirected, authenticated user sees content
  - [x] Implement: Middleware for route protection, auth context/hook, session provider
- [x] Task: Build application shell (header, user menu, logout) 6a0b3a6
  - [x] Write tests: Verify header renders user info when logged in, logout clears session
  - [x] Implement: App layout with header, user avatar/name dropdown, logout button
- [x] Task: Conductor - User Manual Verification 'Phase 3: Authentication' (Protocol in workflow.md)

## Phase 4: Integration & Polish

- [x] Task: Wire frontend API calls to Express backend 6a0b3a6
  - [x] Write tests: Verify API calls reach Express and return expected responses
  - [x] Implement: Create API client utility, configure Next.js rewrites to proxy /api to Express
- [x] Task: Add Socket.io server scaffolding 6a0b3a6
  - [x] Write tests: Verify Socket.io server initializes and accepts connections
  - [x] Implement: Attach Socket.io to Express server, set up connection/disconnect handlers, auth middleware stub
- [x] Task: Create empty dashboard page 6a0b3a6
  - [x] Write tests: Verify dashboard renders for authenticated users
  - [x] Implement: Protected dashboard page with placeholder for boards
- [x] Task: Create .env.example and document setup 6a0b3a6
  - [x] Write tests: Verify .env.example contains all required variables
  - [x] Implement: .env.example with descriptions, update README with setup instructions
- [x] Task: Conductor - User Manual Verification 'Phase 4: Integration & Polish' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions 680cfb4
- [x] Task: Fix tests to run without database c0bbde3
- [x] Task: Set up env files for both apps 59ce4ae
