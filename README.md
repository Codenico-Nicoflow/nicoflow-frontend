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

## Local dev against `nicoflow-shared`

Normally `@nicoflow/shared` resolves to the published npm version (`package.json` dependency). To test unreleased edits without publishing, clone `nicoflow-shared` as a sibling of this repo:

```
Nicoflow/
├── nicoflow-frontend/
└── nicoflow-shared/
```

Then in `nicoflow-shared/`, build in watch mode so `dist/` stays current:

```bash
cd ../nicoflow-shared
pnpm install
pnpm dev            # tsup --watch → rebuilds dist/ on every save
```

In `nicoflow-frontend/package.json`, fill the (already-present, normally empty) `pnpm.overrides` block:

```jsonc
"pnpm": {
  "overrides": {
    "@nicoflow/shared": "file:../nicoflow-shared"
  }
}
```

Then:

```bash
pnpm install        # relinks @nicoflow/shared → the sibling checkout's dist/
pnpm dev
```

Edits saved in `nicoflow-shared/src` rebuild via `tsup --watch` and Vite picks up the changed `dist/` files on the next HMR/reload — no publish step.

⚠️ **Revert this before committing.** Set `overrides` back to `{}` and run `pnpm install` again so `pnpm-lock.yaml` re-resolves to the real published version. A committed `file:` override breaks CI (no sibling checkout exists there) and ships a dependency nobody else can install. `git diff package.json pnpm-lock.yaml` before every commit while doing local-link dev is the easiest way to catch a forgotten override.

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
pnpm test:e2e         # Playwright E2E tests
pnpm test:e2e:ui      # Playwright interactive mode
pnpm storybook        # Storybook → http://localhost:6006
pnpm build-storybook  # Build static Storybook
```

## Testing

Nicoflow follows a **confidence-first** strategy — tests assert what the user sees or what data is returned, not which internal functions were called.

### Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm test`          | Vitest — single pass (CI mode)              |
| `pnpm test:watch`    | Vitest — watch mode                         |
| `pnpm test:ui`       | Vitest browser UI at http://localhost:51204 |
| `pnpm test:coverage` | Coverage report (v8) → `coverage/`          |
| `pnpm test:e2e`      | Playwright E2E against dev server           |
| `pnpm test:e2e:ui`   | Playwright interactive mode                 |

### Layers

**Unit — components** (`src/components/**/*.test.tsx`)
Render output, user interactions, conditional UI states. Uses Vitest + Testing Library + `renderComponent()` (wraps with Redux, Router, ThemeProvider, LoadingOverlay).

**Unit — utilities & hooks** (`src/lib/utils/**/*.test.ts`, `src/hooks/*.test.ts`)
Pure functions, Zod schema validation, hook behaviour. No network calls.

**Integration — features** (future, E-018)
Full feature flows with MSW intercepting HTTP at the network boundary. Handlers live in `src/mocks/handlers.ts`; the test server is exported from `__tests__/server.ts`.

**E2E** (`e2e/*.spec.ts`)
Critical user journeys against a live dev server. Playwright + Chromium only.

### MSW — API Mocking

MSW v2 intercepts HTTP at the node level during Vitest runs. Override handlers per test:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '__tests__/server';

server.use(http.get('http://localhost:8080/v1/areas', () => HttpResponse.json([{ id: 1, name: 'Work' }])));
```

### File Conventions

- Component unit test: `src/components/EmptyState/EmptyState.test.tsx`
- Hook test: `src/hooks/useMobile.test.ts`
- Utility test: `src/lib/utils/utils/helpers.test.ts`
- E2E spec: `e2e/smoke.spec.ts`

### Coverage

Targets (signals, not hard CI gates): utility functions 90%+, components 70%+.
Run `pnpm test:coverage` then open `coverage/index.html`.

---

## Stack

| Layer      | Package                                               |
| ---------- | ----------------------------------------------------- |
| Framework  | React 19 + TypeScript 5.8                             |
| Build      | Vite 7 + Tailwind CSS v4                              |
| Components | shadcn/ui (New York, neutral)                         |
| Routing    | react-router-dom v7                                   |
| State      | @reduxjs/toolkit v2 + RTK Query                       |
| Forms      | react-hook-form v7 + zod v4                           |
| Animations | framer-motion v12                                     |
| DnD        | @dnd-kit/core + @dnd-kit/sortable                     |
| Testing    | Vitest v3 + Testing Library v16 + MSW v2 + Playwright |
| Linting    | ESLint 9 flat config + typescript-eslint              |

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
