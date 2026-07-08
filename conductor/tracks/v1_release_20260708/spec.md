# Track Specification: v1.0 Release & Landing Page Enhancement

## Overview

Prepare the Kanban Collaboration Platform for its **v1.0.0 release** by redesigning the public marketing landing page to showcase all completed MVP features, adding essential open source documentation, and configuring environment-based URLs for the portfolio and GitHub repository.

## Functional Requirements

### 1. Landing Page Redesign (`src/components/marketing/marketing-landing.tsx`)

Restructure the landing page into four distinct sections:

- **Hero Section:** Retain and enhance the existing hero with a compelling headline, subtext, and CTAs ("Get started", "Sign in").
- **Features Section:** Expand the existing 3 features to include all completed MVP capabilities:
  - User authentication & registration
  - Board creation, editing, and management
  - Drag-and-drop lists and cards (with keyboard accessibility)
  - Real-time collaboration via WebSockets (instant sync across users)
  - Board sharing with registered users (owner + member model)
  - Card labels, image attachments, and checklists
  - Responsive design (desktop & tablet)
- **About / Open Source Section:** Clearly state that this is an open source hobby project built as a portfolio showcase.
- **Footer:** Include links to:
  - Portfolio: `https://heniums.vercel.app/`
  - GitHub: `https://github.com/heniums/kanban`

### 2. Environment Configuration

- Add `NEXT_PUBLIC_PORTFOLIO_URL` and `NEXT_PUBLIC_GITHUB_URL` to `.env` file.
- Update `.env.example` with descriptive placeholders for these new variables.

### 3. v1.0 Release Artifacts

- **README.md:** Minimal essentials — project description, portfolio/GitHub links, key features, and basic setup steps.
- **CHANGELOG.md:** First version entry (`v1.0.0`) documenting all completed MVP features since project inception.
- **LICENSE:** MIT License file at repository root.
- **CONTRIBUTING.md:** Basic contribution guidelines (fork, branch, PR process).
- **package.json:** Bump version from `0.1.0` to `1.0.0`. Consider removing `"private": true` for open source visibility.
- **Git Tag:** Create and push `v1.0.0` tag (user will handle manually).

## Non-Functional Requirements

- Landing page must remain responsive and accessible (WCAG 2.1 AA).
- All new documentation must be accurate and reflect the current application state.
- No secrets or credentials in any committed files.
- Changes must pass existing tests, typecheck, and lint.

## Acceptance Criteria

- [ ] Landing page displays all completed MVP features in an organized, visually appealing manner.
- [ ] Landing page clearly identifies the project as open source with portfolio and GitHub links.
- [ ] `.env` contains `NEXT_PUBLIC_PORTFOLIO_URL` and `NEXT_PUBLIC_GITHUB_URL`.
- [ ] `.env.example` is updated with the new URL placeholders.
- [ ] `README.md` exists with minimal essential content.
- [ ] `CHANGELOG.md` exists with v1.0.0 release notes.
- [ ] `LICENSE` file exists with MIT License.
- [ ] `CONTRIBUTING.md` exists with basic guidelines.
- [ ] `package.json` version is `1.0.0`.
- [ ] Git tag `v1.0.0` is created.
- [ ] All tests, typecheck, and lint pass.

## Out of Scope

- Mobile native app marketing
- Marketing analytics or tracking scripts
- Video tutorials or screenshots
- Multi-language / i18n support
- Advanced documentation (API docs, deployment guides)
- npm package publishing
