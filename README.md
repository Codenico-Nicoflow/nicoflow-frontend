# Nicoflow Frontend

React 19 SPA for the Nicoflow task management platform.

## Prerequisites

- Node.js 20+
- pnpm 10.18.3+
- [nicoflow-api](https://github.com/Codenico-Nicoflow/nicoflow-api) (Go backend) running on `http://localhost:8080/v1`

## Quickstart

```bash
git clone https://github.com/Codenico-Nicoflow/nicoflow-frontend.git
cd nicoflow-frontend
pnpm install
pnpm dev        # → http://localhost:5173
```

## Commands

```bash
pnpm dev              # Vite dev server → http://localhost:5173
pnpm build            # Production build → dist/
pnpm preview          # Preview production build locally
pnpm type-check       # tsc --noEmit
pnpm lint             # ESLint
pnpm lint --fix       # Auto-fix import order + formatting
pnpm test             # Vitest (single pass)
pnpm test:watch       # Vitest (watch mode)
pnpm test:ui          # Vitest browser UI
pnpm test:coverage    # Coverage report (v8)
pnpm storybook        # Storybook → http://localhost:6006
pnpm build-storybook  # Build static Storybook
```

## Stack

| Layer      | Package                                  |
| ---------- | ---------------------------------------- |
| Framework  | React 19 + TypeScript 5.8                |
| Build      | Vite 7 + Tailwind CSS v4                 |
| Components | shadcn/ui (New York, neutral)            |
| Routing    | react-router-dom v7                      |
| State      | @reduxjs/toolkit v2 + RTK Query          |
| Forms      | react-hook-form v7 + zod v4              |
| Animations | framer-motion v12                        |
| DnD        | @dnd-kit/core + @dnd-kit/sortable        |
| Testing    | Vitest v3 + Testing Library v16          |
| Linting    | ESLint 9 flat config + typescript-eslint |

## Branching Strategy

| Branch                         | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `main`                         | Stable production code — manual deploy              |
| `staging`                      | Integration branch — auto-deploys to Vercel staging |
| `feature/NIC-XXXX-description` | All feature work                                    |

Flow: `feature/*` → PR to `staging` → PR to `main`

## CI/CD

GitHub Actions (`.github/workflows/`):

| Workflow                | Trigger                             | Jobs                             |
| ----------------------- | ----------------------------------- | -------------------------------- |
| `ci.yml`                | PR to `main` or `staging`           | lint → type-check → test → build |
| `deploy-staging.yml`    | push to `staging`                   | build → Vercel staging           |
| `deploy-production.yml` | `workflow_dispatch` (type "DEPLOY") | build → Vercel production        |

### Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                         | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `VERCEL_TOKEN`                 | Vercel personal access token                     |
| `VERCEL_ORG_ID`                | Vercel team/org ID                               |
| `VERCEL_PROJECT_ID_STAGING`    | Vercel project ID for the staging environment    |
| `VERCEL_PROJECT_ID_PRODUCTION` | Vercel project ID for the production environment |
| `VITE_API_URL_STAGING`         | Backend API base URL for staging builds          |
| `VITE_API_URL_PRODUCTION`      | Backend API base URL for production builds       |

## License

Private
