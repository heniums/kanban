# Code Style Guide

## TypeScript

### Naming
- **Variables/Functions:** camelCase (`boardId`, `getUserBoards`)
- **Types/Interfaces:** PascalCase (`Board`, `CardInput`, `UserRole`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_CARDS_PER_BOARD`)
- **Files:** kebab-case (`board-service.ts`, `use-websocket.ts`)
- Prefer `interface` for object shapes, `type` for unions/primitives

### Strictness
- `strict: true` in tsconfig
- No `any` — use `unknown` and narrow with type guards
- Explicit return types on exported functions

### Imports
- Built-in modules → third-party → local (alphabetical within each group)
- Use `@/` path alias for project root imports

## React / Next.js

### Components
- PascalCase file names matching component name (`BoardList.tsx`)
- Prefer function components with hooks
- One component per file (except small co-located helpers)
- Props interfaces named `ComponentNameProps`

### Hooks
- Custom hooks prefixed with `use` (`useBoardSocket`, `useAuth`)
- Keep hooks at the top of the component body
- No conditional hooks

### File Structure
```
src/
  app/           # Next.js App Router pages + layouts
  components/    # Shared UI components
  lib/           # Utilities, API clients
  hooks/         # Custom React hooks
  types/         # Shared TypeScript types
```

## Express

### Routes
- Resource-based naming: `/api/boards`, `/api/boards/:id/cards`
- One router file per resource in `routes/`
- Controllers handle request/response; services handle business logic

### Middleware
- Auth middleware applied at router level, not per-route
- Validation middleware using Zod schemas before controllers

### Errors
- Centralized error handler (last middleware)
- Custom `AppError` class with status code and message
- Never expose stack traces in production

## General

### Formatting
- Prettier with default config (2-space indent, single quotes, trailing commas)
- ESLint with typescript-eslint and react-hooks plugins
- Format on save, lint on pre-commit

### Git
- Branch naming: `feature/short-description`, `fix/short-description`
- Commit messages: imperative mood, present tense (`Add board creation endpoint`)
