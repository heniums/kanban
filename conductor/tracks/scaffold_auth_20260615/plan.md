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

- [ ] Task: Implement user registration endpoint
  - [ ] Write tests: Test successful registration, duplicate email, invalid input
  - [ ] Implement: POST /api/auth/register with Zod validation, bcrypt hashing, user creation
- [ ] Task: Configure NextAuth.js with credentials provider
  - [ ] Write tests: Verify NextAuth configuration exports correctly
  - [ ] Implement: Set up auth.ts with CredentialsProvider, JWT strategy, session callbacks
- [ ] Task: Implement login endpoint
  - [ ] Write tests: Test successful login, invalid credentials, missing fields
  - [ ] Implement: Wire NextAuth.js signIn, verify password against bcrypt hash, return session
- [ ] Task: Build registration page UI
  - [ ] Write tests: Test form validation, successful registration flow, error display
  - [ ] Implement: Registration form component with React Hook Form + Zod, redirect on success
- [ ] Task: Build login page UI
  - [ ] Write tests: Test form validation, successful login flow, error display
  - [ ] Implement: Login form component with React Hook Form + Zod, redirect on success
- [ ] Task: Implement protected routes and session handling
  - [ ] Write tests: Verify unauthenticated user is redirected, authenticated user sees content
  - [ ] Implement: Middleware for route protection, auth context/hook, session provider
- [ ] Task: Build application shell (header, user menu, logout)
  - [ ] Write tests: Verify header renders user info when logged in, logout clears session
  - [ ] Implement: App layout with header, user avatar/name dropdown, logout button
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Authentication' (Protocol in workflow.md)

## Phase 4: Integration & Polish

- [ ] Task: Wire frontend API calls to Express backend
  - [ ] Write tests: Verify API calls reach Express and return expected responses
  - [ ] Implement: Create API client utility, configure Next.js rewrites to proxy /api to Express
- [ ] Task: Add Socket.io server scaffolding
  - [ ] Write tests: Verify Socket.io server initializes and accepts connections
  - [ ] Implement: Attach Socket.io to Express server, set up connection/disconnect handlers, auth middleware stub
- [ ] Task: Create empty dashboard page
  - [ ] Write tests: Verify dashboard renders for authenticated users
  - [ ] Implement: Protected dashboard page with placeholder for boards
- [ ] Task: Create .env.example and document setup
  - [ ] Write tests: Verify .env.example contains all required variables
  - [ ] Implement: .env.example with descriptions, update README with setup instructions
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration & Polish' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions 680cfb4
