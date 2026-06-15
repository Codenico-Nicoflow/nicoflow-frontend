# CLAUDE.md — nicoflow-frontend

> **Repo names:** GitHub remote = `nicoflow-frontend` · local clone folder = `nicoflow-monorepo`

React 19 SPA for the Nicoflow task-management platform.

> **Repo shape:** the **live app is `src/`** at the repo root (a single Vite SPA). The repo is _also_ set up as a pnpm workspace (`pnpm-workspace.yaml`, `apps/{web,mobile}`, `packages/{shared,store,types,constants,utils}`) — but those dirs are currently **empty scaffolding** prepared for the mobile phase (E-033, "extract `@nicoflow/shared`"). Don't delete the scaffolding; don't treat `apps/web` as the app — it isn't wired yet. The earlier "Standalone repo — not a monorepo" line was half-true: standalone today, workspace-ready for tomorrow.

> **Umbrella context:** this repo sits under `../CLAUDE.md` (the Nicoflow workspace root), which owns the **cross-repo contract** with the backend (`nicoflow-api`). Read it for the response envelope, auth handshake, base URLs, and known contract drift.

**Backend:** `nicoflow-api` (Go) — local `http://localhost:8080/v1`, prod `https://api.nicoflow.app/v1`.

For any third-party library, fetch current docs via **Context7 MCP** before writing code.

---

## Stack (actual versions)

| Layer       | Package                                                                   | Notes                                                                     |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework   | `react@19.1` + `react-dom@19.1`                                           |                                                                           |
| Language    | `typescript@~5.8`                                                         | strict mode                                                               |
| Build       | `vite@7` + `@tailwindcss/vite`                                            | SVGs via `vite-plugin-svgr`                                               |
| Styling     | `tailwindcss@4` + `tailwindcss-animate`                                   | tokens in `src/index.css` as CSS custom properties                        |
| Components  | `shadcn/ui` (New York, neutral)                                           | primitives in `src/components/ui/`                                        |
| Routing     | `react-router-dom@7`                                                      | `useRoutes` pattern in `src/router.tsx`                                   |
| State       | `@reduxjs/toolkit@2` + RTK Query                                          |                                                                           |
| Persistence | `redux-persist@6`                                                         | whitelist: `['auth']` only                                                |
| Auth mutex  | `async-mutex@0.5`                                                         | prevents parallel refresh races in `baseQuery.ts`                         |
| Forms       | `react-hook-form@7` + `zod@4` + `@hookform/resolvers`                     |                                                                           |
| Animations  | `framer-motion@12`                                                        |                                                                           |
| DnD         | `@dnd-kit/core` + `@dnd-kit/sortable`                                     |                                                                           |
| Icons       | `lucide-react`                                                            | `LazyIcon` for dynamic-by-name loading                                    |
| Toasts      | `sonner@2`                                                                | never `react-toastify` — removed                                          |
| Theme       | `next-themes`                                                             | `storageKey="nicoflow-theme"`, `defaultTheme="system"` in `Providers.tsx` |
| Testing     | `vitest@3` + `@testing-library/react@16` + `msw@2` + `@playwright/test@1` |                                                                           |
| Linting     | `eslint@9` flat config + `typescript-eslint` + `simple-import-sort`       |                                                                           |
| Formatting  | `prettier`                                                                | single quotes, 120 width, 2-space indent                                  |
| Git hooks   | `husky` + `lint-staged`                                                   | lint + prettier on commit                                                 |
| Storybook   | `storybook@10` + `@storybook/react-vite`                                  | stories in `src/**/*.stories.tsx`                                         |

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx            — mounts <AppRoutes />
│   └── Providers.tsx      — Redux store, BrowserRouter, ThemeProvider (storageKey "nicoflow-theme"), Toaster, LoadingOverlay
├── assets/svgs/           — SVG files (imported as React components via vite-plugin-svgr)
├── components/            — Shared, domain-agnostic components
│   ├── ui/                — shadcn/ui primitives (CLI-generated, edit carefully)
│   ├── NameField/ DescriptionField/ DueDateField/ EstimatedTimeField/ PriorityField/
│   ├── IconField/ CheckboxField/ UrlField/         — form field wrappers (one folder each)
│   ├── FormDialog/ ConfirmDialog/ CustomDialog/ DialogFieldGrid/  — dialog shells + layout
│   ├── AnimatedListItem/ ListItemCard/ ItemActionsMenu/ EmptyState/ Timestamp/  — list UI
│   ├── Divider/ PageStub/                            — misc primitives
│   ├── LazyIcon/                                     — dynamic Lucide icon by name string
│   ├── DragAndDropContext/                           — dnd-kit DndContext wrapper (project reorder between areas)
│   ├── ModeToggle/ ThemeProvider/ Toaster/ LoadingOverlayProvider/  — app chrome
│   └── index.ts
├── features/              — Feature-first modules; each exports from index.(tsx|ts).
│   │                        Larger features nest components/ + states/ + utils/ subfolders.
│   ├── Area/              — components/ + index.tsx
│   ├── Bucket/            — components/ + utils/ + index.tsx
│   ├── Project/           — components/ + states/ + index.tsx
│   ├── Sidebar/           — AppSidebar via components/; Areas/ QuickAccess/ Footer/ + data.ts + index.tsx
│   ├── SignForm/          — SignForm.tsx, BottomText, RememberMe, SocialButtons + index.ts
│   └── Tasks/             — components/ + states/ + utils/ + index.ts
├── hooks/
│   ├── useMobile.ts       — breakpoint detection
│   └── useCustomDialog.ts — open/close state helper
├── layout/
│   ├── AuthLayout.tsx · PrivateLayout.tsx · CustomSidebarTrigger.tsx · QuickAddButton.tsx
├── lib/
│   ├── store/
│   │   ├── store.ts       — configureStore, persistedReducer (persist whitelist: ['auth'])
│   │   ├── hooks.ts       — useAppDispatch, useAppSelector, useAppUser
│   │   ├── index.ts       — barrel: ALL store exports (single import point)
│   │   ├── utils/invalidateTags.ts  — invalidateApiTags() helper
│   │   └── slices/
│   │       ├── baseQuery.ts          — fetchBaseQuery + async-mutex reauth logic
│   │       ├── auth/  area/  project/  tasks/  bucket/   — each: <name>Api.ts (+ authSlice, type.ts)
│   ├── types/
│   │   ├── interfaces/index.ts       — IArea, IProject, ITask, IBucket, IUser + ApiEnvelope<T>
│   │   ├── constants.ts              — TaskStatus, TaskPriority, ScheduledFor, FilterBy, PROJECT_STATUS, etc.
│   │   ├── endpoints.ts              — AUTH_API, AREA_API, PROJECT_API, TASKS_API, BUCKET_API
│   │   ├── icons.ts                  — IconId union + ICON_IDS
│   │   └── index.ts                  — barrel (ApiEnvelope re-exported here)
│   └── utils/
│       ├── index.ts                  — barrel for schemas + messages + helpers
│       └── utils/                    — schemas.ts, messages.ts, helpers.ts, get-icons.ts (+ .test.ts)
├── mocks/
│   └── handlers.ts        — MSW request handlers (envelope() helper matches the API shape)
├── pages/
│   ├── auth/              — SignIn, SignUp, ForgotPassword, ResetPassword (+ co-located .test.tsx)
│   ├── quick-access/      — Bucket, Today, Tomorrow, NextSevenDays
│   ├── project/           — ProjectView
│   ├── Profile.tsx · ErrorPage.tsx · HelpAndInformation.tsx · PrivacyPolicy.tsx · TermsOfService.tsx
└── router.tsx             — useRoutes config; PrivateRoutes guard reads useAppUser()

__tests__/
├── setup.ts              — mocks: matchMedia, localStorage, sessionStorage, IntersectionObserver, ResizeObserver
├── server.ts             — MSW node server (exported for integration tests)
├── renderComponent.tsx   — render helper (Redux + Router + Theme + LoadingOverlay)
├── mocks/                — shared test mock data
├── PrivateRoutes.test.tsx · SessionRestorer.test.tsx
e2e/
├── smoke.spec.ts · auth.spec.ts   — Playwright (Chromium)
```

---

## Routes (`src/router.tsx`)

```
/ (PrivateLayout — requires user in Redux auth slice)
  /                       → redirect to /quick-access/bucket
  /quick-access/Bucket    /quick-access/today    /quick-access/tomorrow    /quick-access/next-7-days
  /projects/:projectId
  /projects/new           → placeholder <div>New Project</div>
  /profile
  /help-information

/ (AuthLayout — public)
  /sign-in   /sign-up   /forgot-password   /reset-password

/privacy-policy   /terms-of-service   (standalone)
* → ErrorPage
```

Auth guard is `PrivateRoutes` (`src/router.tsx`): reads `useAppUser()` — if `null`, redirects to `/sign-in` preserving `state.from` for post-login redirect. `SessionRestorer` rehydrates the session on load.

---

## API Response Envelope

**Every** backend response is wrapped:

```typescript
// src/lib/types/interfaces/index.ts  (re-exported from src/lib/types)
export type ApiErrorBody = { code: string; message: string };
export type ApiEnvelope<T> = {
  data: T;
  error: ApiErrorBody | null;
};
```

RTK Query endpoints **must** unwrap via `transformResponse`:

```typescript
// ✅ correct
builder.query<IArea[], void>({
  query: () => '/areas',
  transformResponse: (raw: ApiEnvelope<IArea[]>) => raw.data,
});
// ❌ wrong — result.data ends up being the whole envelope
builder.query<IArea[], void>({ query: () => '/areas' });
```

Error handling keys off `error.code` (the string from §4), **not** the HTTP status alone.

`ApiEnvelope<T>` lives in **`src/lib/types/interfaces/index.ts`** and is re-exported from `src/lib/types` and `src/lib/store/slices/auth/type.ts`. Import it; don't redefine. MSW handlers in `src/mocks/handlers.ts` use an `envelope()` helper to match this shape.

---

## API & Auth

**Base URL:** `import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1'` — in `src/lib/store/slices/baseQuery.ts` (env-driven, with an 8080 local default; **not** hardcoded).

**Token flow:**

The access token lives **in memory only** — in the Redux `auth` slice (`state.auth.token`), read in `prepareHeaders` (`baseQuery.ts`). It is **NOT persisted**: redux-persist whitelists `auth`, but only `user` survives a reload — the token is deliberately dropped (kept out of `localStorage` for XSS safety). The refresh token is an `HttpOnly` cookie the browser sends automatically; the JS never sees it.

1. On login, the access token is stored in the `auth` slice → `Authorization: Bearer <token>` is attached to every request via `prepareHeaders`.
2. **On reload the access token is gone** (memory cleared). `user` rehydrates from `persist:root`, so the app thinks you're logged in — but there's no token yet. `SessionRestorer` (`Providers.tsx`) therefore **blocks rendering of protected content** until it re-obtains a token via `POST /auth/refresh-token` (the HttpOnly cookie authenticates that call). This ordering is load-bearing: if a protected query fires before the token is restored, it goes out with **no Authorization header** and 401s instantly.
3. On `401` mid-session: `baseQuery` runs a **single-flight** refresh (shared `refreshSession` + `async-mutex` + an in-flight-promise guard) so concurrent 401s and the on-load restore never fire two `/refresh-token` calls — a duplicate would replay the rotated (consumed) token and trip backend reuse-detection, revoking all sessions.
4. Refresh success → store the new token, retry the original request. Refresh failure → only on a **definitive** auth error (`INVALID_TOKEN` / `UNAUTHORIZED` / `INVALID_REFRESH_TOKEN`) clear auth + redirect to `/sign-in`; a transient (network/5xx) failure keeps the persisted session.

> ⚠️ Do **not** reintroduce `localStorage('authToken')` (or `nicoflow_access_token` / `nicoflow_refresh_token`) — those are an **old, removed** token flow. Stale copies may linger in a dev browser's localStorage and are dead (nothing reads them). The token is memory-only by design.

**Endpoint constants** (`src/lib/types/endpoints.ts`) — note these are **explicit paths**, e.g.:

```
AUTH_API.LOGIN          = '/auth/login'
AUTH_API.GET_CURRENT_USER = '/users/profile'
AREA_API.GET_AREAS_WITH_PROJECTS = '/areas/with-projects'
PROJECT_API / TASKS_API / BUCKET_API   — '/projects', '/tasks', '/bucket'
```

---

## State Management

**RTK Query for all server state.** Never `useEffect` + `fetch`.

Import all API hooks from the `@/lib/store` barrel, **not** from slice files:

```typescript
// ✅ correct
import { useGetAreasQuery, useCreateProjectMutation } from '@/lib/store';
// ❌ wrong
import { areaApi } from '@/lib/store/slices/area/areaApi';
```

**Tag invalidation** — use the typed helper, not direct dispatch:

```typescript
import { invalidateApiTags, areaApi } from '@/lib/store';
invalidateApiTags(dispatch, areaApi, ['Area'] as const);
```

**Store hooks:**

```typescript
const dispatch = useAppDispatch(); // typed AppDispatch
const value = useAppSelector(s => s.auth); // typed RootState
const user = useAppUser(); // shorthand for auth.user
```

**Persistence:** only the `auth` reducer key is persisted. RTK Query cache is never persisted.

---

## Data Types (`src/lib/types/interfaces/index.ts`)

All IDs are `string` (TEXT PKs — UUID/NanoID). Never add `Number()` coercion.

```typescript
IArea    { id: string; name; color; icon?; displayOrder?; createdAt; updatedAt; projects?: IProject[] }
IProject { id: string; areaId: string|null; name; status: 'active'|'archived'|'completed'; folderIcon; dueDate?|null; isFavorite?; description?|null; displayOrder?; createdAt; updatedAt }
ITask    { id: string; projectId: string; title; notes?|null; status: TaskStatus; priority: TaskPriority; dueDate?|null; scheduledFor?: 'today'|'tomorrow'|'this_week'|null; estimatedMinutes?|null; url?|null; displayOrder?; completedAt?|null; createdAt; updatedAt }
IBucket  { id: string; userId: string; content; processedAt?|null; processingResult?|null; createdTaskId?|null; createdNoteId?|null; projectId?|null; createdAt; updatedAt }
IUser    { id: string; email; firstName; lastName; username; theme: 'light'|'dark'; imageUrl; status: 'premium'|'regular' }
```

Task fields: `title` (VARCHAR 255) and `notes` (TEXT, optional/nullable) — **not** `name`/`description`.

Key constants (`src/lib/types/constants.ts`):

```typescript
TaskStatus     { TODO, IN_PROGRESS, DONE }
TaskPriority   { LOW, MEDIUM, HIGH }
TaskSortField  { DUE_DATE, PRIORITY, NAME, CREATED_AT }
TaskSortOrder  / FilterBy / ScheduledFor { today, tomorrow, this_week }
PROJECT_STATUS { ACTIVE, COMPLETED, ARCHIVED }
USER_STATUS    { PREMIUM, REGULAR }
GENERAL_AREA   = 'general'
ProcessingResult 'task' | 'note' | 'trash'   + BUCKET_PROCESSING_OPTIONS
```

---

## Forms

All schemas in `src/lib/utils/utils/schemas.ts`, exported from `src/lib/utils`:

```typescript
import { projectSchema, type ProjectFormData } from '@/lib/utils';
const form = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
```

Available: `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `projectSchema` (has `areaId`), `areaSchema`, `updateAreaSchema`, `taskSchema`, `bucketSchema`, `processBucketSchema`.

Password rules (`passwordSchema`): min 8, max 72 (bcrypt truncation limit), ≥1 uppercase + ≥1 lowercase (no digit requirement) — matches the backend `validatePassword` and SPEC §3. Username: min 3, max 20, alphanumeric.

---

## Toast Messages

Use `sonner` + the shared `ToastMessages` const (`src/lib/utils/utils/messages.ts`):

```typescript
import { toast } from 'sonner';
import { ToastMessages } from '@/lib/utils';
toast.success(ToastMessages.PROJECT_CREATED);
toast.error(ToastMessages.UNEXPECTED_ERROR);
```

**Never** `import { toast } from 'react-toastify'` — removed from the project.

---

## Component Conventions

**Field components** — reuse the existing field wrappers inside dialogs; don't reinvent:
`<NameField control={form.control} />`, `<PriorityField …/>`, `<DueDateField …/>`, `<IconField …/>`, etc.

**Dialog shells:** `<FormDialog>` (create/edit form) · `<ConfirmDialog>` (destructive yes/no) · `<CustomDialog>` (freeform).

**Lists:** `<AnimatedListItem>` (Framer Motion `layout` + `AnimatePresence`) · `<ListItemCard>` (card row) · `<ItemActionsMenu>` (three-dot `DropdownMenu`).

**Drag and drop:** `<DragAndDropContext>` wraps dnd-kit's `DndContext`; droppable areas use id pattern `'area-${areaId}'`; drop triggers `updateProject` to change `areaId`.

**Adding shadcn/ui components:** `npx shadcn@latest add <name>` → outputs to `src/components/ui/`.

---

## ESLint Rules (enforced)

| Rule                                 | Level   | Notes                           |
| ------------------------------------ | ------- | ------------------------------- |
| `@typescript-eslint/no-explicit-any` | `error` | **No exceptions**               |
| `@typescript-eslint/no-unused-vars`  | `warn`  | prefix `_` to suppress          |
| `simple-import-sort/imports`         | `error` | Auto-fix with `pnpm lint --fix` |
| `import/no-duplicates`               | `error` |                                 |
| `import/first`                       | `error` |                                 |

React hooks rules (`eslint-plugin-react-hooks`) apply to `src/**`.

**Import order** (simple-import-sort): react/react-dom → other externals → `@/` aliases → parent `../` → same-folder `./`.

---

## Testing

```bash
pnpm test              # vitest run (single pass / CI)
pnpm test:watch        # vitest (watch)
pnpm test:ui           # vitest --ui
pnpm test:coverage     # vitest run --coverage (v8)
pnpm test:e2e          # playwright test
pnpm test:e2e:ui       # playwright test --ui
```

- **Setup** (`__tests__/setup.ts`): stubs `matchMedia`, `localStorage`, `sessionStorage`, `IntersectionObserver`, `ResizeObserver`.
- **Render helper** (`__tests__/renderComponent.tsx`): wraps with Redux + Router + Theme + LoadingOverlay.
- **MSW** (`__tests__/server.ts` node server + `src/mocks/handlers.ts`): intercepts HTTP at the network boundary. Override per test with `server.use(...)`.
- **Test files** co-located: `ComponentName.test.tsx` next to the component; page tests live beside pages.
- **E2E:** `e2e/*.spec.ts`, Playwright + Chromium.
- Coverage targets (signals, not hard gates): utilities 90%+, components 70%+.

---

## Storybook

```bash
pnpm storybook         # → http://localhost:6006
pnpm build-storybook
```

Stories co-located as `src/**/ComponentName.stories.tsx` (all components except `src/components/ui/`). Infra: `src/stories/store/storybookStore.ts`, `src/stories/decorators/withStoryProviders.tsx`, `src/stories/helpers/StoryFormWrapper.tsx`, `src/stories/mocks/index.ts`.

---

## Local Dev

```bash
# Prerequisites: Node 20+, pnpm 10.18.3+, nicoflow-api running on :8080/v1
pnpm install
pnpm dev           # Vite → http://localhost:5173
pnpm type-check    # tsc --noEmit
pnpm lint          # eslint .
pnpm lint --fix    # auto-fix import order + formatting
pnpm test
pnpm build         # → dist/
pnpm storybook     # → http://localhost:6006
```

---

## CI/CD

`.github/workflows/` (GitHub Actions):

| File                    | Trigger                             | Jobs                                        |
| ----------------------- | ----------------------------------- | ------------------------------------------- |
| `ci.yml`                | PR to `main` or `staging`           | lint → type-check → test (parallel) → build |
| `deploy-staging.yml`    | push to `staging`                   | install → build → Vercel staging            |
| `deploy-production.yml` | `workflow_dispatch` (type "DEPLOY") | install → build → Vercel production         |

**Required secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret                         | Description                                |
| ------------------------------ | ------------------------------------------ |
| `VERCEL_TOKEN`                 | Vercel personal access token               |
| `VERCEL_ORG_ID`                | Vercel team/org ID                         |
| `VERCEL_PROJECT_ID_STAGING`    | Vercel project ID for staging              |
| `VERCEL_PROJECT_ID_PRODUCTION` | Vercel project ID for production           |
| `VITE_API_URL_STAGING`         | Backend API base URL for staging builds    |
| `VITE_API_URL_PRODUCTION`      | Backend API base URL for production builds |

Deployment: Vercel. `vercel.json` handles SPA fallback routing.

**Branching (unified with the backend repo):** `<type>/NIC-<ticket>-<desc>`, `<type>` ∈ `feature | bugfix | hotfix | chore | refactor` (e.g. `feature/NIC-1076-path-alias`). `hotfix/*` branches from `main`; the rest from `staging`. Flow: branch → PR to `staging` (auto-deploys to Vercel staging) → PR to `main` (manual production deploy).
