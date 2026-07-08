# Kanban

A real-time collaborative kanban board application for teams that want to move work forward.

**Portfolio:** [henumus.vercel.app](https://henumus.vercel.app/)
**Repository:** [github.com/henumus/kanban](https://github.com/henumus/kanban)

## Features

- **Authentication** — Register, sign in, and manage your profile
- **Board management** — Create, edit, and organize boards with lists and cards
- **Drag-and-drop** — Reorder lists and move cards with keyboard-accessible dnd-kit
- **Real-time collaboration** — Instant sync across users via Socket.io WebSockets
- **Board sharing** — Invite registered users with an owner + member model
- **Labels & attachments** — Color-coded labels and Cloudinary-powered image attachments
- **Responsive design** — Desktop and tablet friendly with WCAG 2.1 AA accessibility

## Tech Stack

- **Frontend:** React 19, Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js Server Actions, Socket.io (custom server)
- **Database:** PostgreSQL 16 (Neon) with Drizzle ORM
- **Auth:** NextAuth.js v5
- **Testing:** Vitest, Playwright

## Getting Started

```bash
# Clone the repository
git clone https://github.com/henumus/kanban.git
cd kanban

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, auth secret, and Cloudinary credentials

# Push database schema
npm run db:push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start development server           |
| `npm run build`     | Build for production               |
| `npm start`         | Start production server            |
| `npm test`          | Run unit/integration tests         |
| `npm run typecheck` | Run TypeScript type checking       |
| `npm run lint`      | Run ESLint                         |
| `npm run format`    | Check formatting with Prettier     |
| `npm run db:push`   | Push schema to database            |
| `npm run db:seed`   | Seed the database with sample data |

## License

MIT
