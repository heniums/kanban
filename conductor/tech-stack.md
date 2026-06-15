# Technology Stack: Kanban Collaboration Platform

## Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript | Full-stack type safety, excellent tooling |
| Runtime | Node.js 22+ | Mature ecosystem, WebSocket-native |
| Frontend | React 18 + Next.js 14 (App Router) | SSR/SSG, file-based routing, API routes |
| Backend | Express.js + Socket.io | Battle-tested HTTP + real-time WS with rooms |
| Database | PostgreSQL 16 (Neon) | Serverless Postgres with connection pooling, branching for dev |
| ORM | Drizzle ORM + @neondatabase/serverless | Type-safe queries, native serverless driver, lightweight |

## Supporting Libraries

| Concern | Library | Purpose |
|---------|---------|---------|
| Auth | NextAuth.js v5 (Auth.js) | OAuth providers + credentials, session management |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS, pre-built accessible components |
| Validation | Zod | Shared schemas across client/server, runtime type checking |
| Drag & Drop | dnd-kit | Accessible, keyboard-native DnD with spring animations |
| State | Zustand | Lightweight client state (boards, notifications) |
| Forms | React Hook Form + Zod | Performant forms with schema validation |
| Icons | Lucide React | Consistent 24px icon set |
| Testing | Vitest + Playwright | Unit/integration (Vitest), E2E (Playwright) |
| Package Manager | Bun | Fast installs, native TypeScript support |

## Architecture

```
┌─────────────────────────────────────────┐
│              Next.js (App Router)        │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │  Pages  │  │  API Routes  │  │ Layouts│ │
│  └─────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────┤
│            Socket.io Client             │
├─────────────────────────────────────────┤
                    │
                    │ WebSocket
                    ▼
├─────────────────────────────────────────┤
│         Express.js + Socket.io          │
│  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │  REST    │  │   WS   │  │ Middleware │
│  │ (Next API) │  │ Rooms  │  │ (Auth)   │
│  └──────────┘  └────────┘  └────────┘  │
├─────────────────────────────────────────┤
│            Drizzle ORM                  │
├─────────────────────────────────────────┤
│        PostgreSQL (Neon)               │
└─────────────────────────────────────────┘
```

## Development Tools

- **Linting:** ESLint + Prettier (consistent formatting)
- **Git Hooks:** Husky + lint-staged (pre-commit checks)
- **CI/CD:** GitHub Actions (typecheck, lint, test on push)
- **Hosting:** Vercel (frontend) + Railway/Render (backend) + Neon (database)
