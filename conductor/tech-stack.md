# Technology Stack: Kanban Collaboration Platform

## Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript | Full-stack type safety, excellent tooling |
| Runtime | Node.js 22+ | Mature ecosystem, WebSocket-native |
| Frontend | React 19 + Next.js 16 (App Router) | RSCs by default, `use()`/`useOptimistic` hooks, Actions, Turbopack stable, partial prerendering |
| Backend | Express.js + Socket.io | Battle-tested HTTP + real-time WS with rooms |
| Database | PostgreSQL 16 (Neon) | Serverless Postgres with connection pooling, branching for dev |
| ORM | Drizzle ORM + pg (node-postgres) | Type-safe queries, lightweight, server-runnable from Next.js Server Actions |

## Supporting Libraries

| Concern | Library | Purpose |
|---------|---------|---------|
| Auth | NextAuth.js v5 (Auth.js) | OAuth providers + credentials, session management |
| Styling | Tailwind CSS v4 + shadcn/ui | CSS-first config (`@theme`), container queries, Oxide engine (10x faster), dynamic utilities |
| Validation | Zod | Shared schemas across client/server, runtime type checking |
| Drag & Drop | dnd-kit | Accessible, keyboard-native DnD with spring animations |
| State | Zustand | Lightweight client state (boards, notifications) |
| Forms | React Hook Form + Zod | Performant forms with schema validation |
| Icons | Lucide React | Consistent 24px icon set |
| Testing | Vitest + Playwright | Unit/integration (Vitest), E2E (Playwright) |
| Package Manager | npm | Workspace-native, reliable lockfile, universal availability |

## Architecture

```
┌─────────────────────────────────────────┐
│              Next.js (App Router)        │
│  ┌─────────┐  ┌─────────────┐  ┌────────┐ │
│  │  Pages  │  │Server Actions│  │ Layouts│ │
│  └─────────┘  └─────────────┘  └────────┘ │
├─────────────────────────────────────────┤
│            Socket.io Client             │
├─────────────────────────────────────────┤
                    │
                    │ WebSocket
                    ▼
├─────────────────────────────────────────┤
│         Express.js + Socket.io          │
│  ┌──────────┐  ┌──────────┐           │
│  │ Auth REST │  │   WS     │           │
│  │ (register,│  │  Rooms   │           │
│  │  login)   │  │          │           │
│  └──────────┘  └──────────┘           │
├─────────────────────────────────────────┤
│            Drizzle ORM                  │
├─────────────────────────────────────────┤
│        PostgreSQL (Neon)               │
│                                         │
│  Board CRUD: Next.js → Drizzle → Neon   │
│  (single hop, no Express proxy)         │
└─────────────────────────────────────────┘
```

## Development Tools

- **Linting:** ESLint 9 (flat config) + Prettier (consistent formatting)
- **Git Hooks:** Husky + lint-staged (pre-commit checks)
- **CI/CD:** GitHub Actions (typecheck, lint, test on push)
- **Hosting:** Vercel (frontend) + Railway/Render (backend) + Neon (database)
