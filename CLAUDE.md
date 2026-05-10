# nicoflow-frontend

React 19 SPA for the Nicoflow task management platform. Standalone repo — not a monorepo.

**Backend:** `nicoflow-api` (Go) at `http://localhost:8080/`

---

## Stack

| Layer       | Package                                                             | Notes                                                      |
| ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Framework   | `react@19`, `react-dom@19`                                          |                                                            |
| Language    | `typescript@5.8`                                                    | strict mode                                                |
| Build       | `vite@7` + `@tailwindcss/vite`                                      | SVGs via `vite-plugin-svgr`                                |
| Styling     | `tailwindcss@4` + `tailwindcss-animate`                             | tokens in `src/index.css` as CSS custom properties         |
| Components  | `shadcn/ui` (New York, neutral)                                     | primitives in `src/components/ui/`                         |
| Routing     | `react-router-dom@7`                                                | `useRoutes` pattern in `src/router.tsx`                    |
| State       | `@reduxjs/toolkit@2` + RTK Query                                    |                                                            |
| Persistence | `redux-persist@6`                                                   | whitelist: `['auth']` only                                 |
| Auth mutex  | `async-mutex`                                                       | prevents parallel refresh races in `baseQuery.ts`          |
| Forms       | `react-hook-form@7` + `zod@4` + `@hookform/resolvers`               |                                                            |
| Animations  | `framer-motion@12`                                                  |                                                            |
| DnD         | `@dnd-kit/core` + `@dnd-kit/sortable`                               |                                                            |
| Icons       | `lucide-react`                                                      | `LazyIcon` for dynamic-by-name loading                     |
| Toasts      | `sonner@2`                                                          | **never** `react-toastify` (still in package.json, unused) |
| Theme       | `next-themes`                                                       | key `"nicoflow-theme"` in `Providers.tsx`                  |
| Testing     | `vitest@3` + `@testing-library/react@16` + `msw@2` + `playwright@1` |                                                            |
| Linting     | `eslint@9` flat config + `typescript-eslint` + `simple-import-sort` |                                                            |
| Formatting  | `prettier`                                                          | single quotes, 120 width, 2-space indent                   |
| Git hooks   | `husky` + `lint-staged`                                             | lint + prettier on commit                                  |
| Storybook   | `storybook@10` + `@storybook/react-vite`                            | stories in `src/**/*.stories.tsx`                          |

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx            — mounts <AppRoutes />
│   └── Providers.tsx      — Redux store, BrowserRouter, ThemeProvider, Toaster, LoadingOverlay
├── assets/svgs/           — SVG files (imported as React components via vite-plugin-svgr)
├── components/            — Shared, domain-agnostic components
│   ├── ui/                — shadcn/ui primitives (CLI-generated, edit carefully)
│   ├── NameField/         — text input field wrapper
│   ├── DescriptionField/
│   ├── DueDateField/      — uses react-day-picker
│   ├── EstimatedTimeField/
│   ├── PriorityField/
│   ├── IconField/         — icon picker using LazyIcon
│   ├── CheckboxField/
│   ├── UrlField/
│   ├── FormDialog/        — standard create/edit modal shell
│   ├── ConfirmDialog/     — yes/no destructive action modal
│   ├── CustomDialog/      — flexible modal
│   ├── DialogFieldGrid/   — 2-col grid layout for dialog forms
│   ├── AnimatedListItem/  — framer-motion enter/exit for list rows
│   ├── ListItemCard/      — card-style list row
│   ├── ItemActionsMenu/   — three-dot action menu
│   ├── EmptyState/
│   ├── Timestamp/
│   ├── LazyIcon/          — dynamic Lucide icon by name string
│   ├── DragAndDropContext/— dnd-kit DndContext wrapper (handles project reorder between areas)
│   ├── ModeToggle/
│   ├── ThemeProvider/
│   ├── Toaster/
│   └── LoadingOverlayProvider/
├── features/              — Feature-first modules; each exports from index.tsx
│   ├── Area/              — Area CRUD (AreaDialog, AreaContextMenu, AreaSortOrderField)
│   ├── Bucket/            — Inbox: BucketList, BucketQuickInput, BucketProcessDialog, etc.
│   ├── Project/           — ProjectDialog, ProjectDeleteDialog, ProjectHeader, ProjectAreaField
│   ├── Sidebar/
│   │   ├── AppSidebar/    — root sidebar component
│   │   ├── Areas/         — collapsible area sections + draggable project items
│   │   ├── QuickAccess/   — Today / Tomorrow / Next 7 Days / Bucket nav items
│   │   └── Footer/        — user profile, theme toggle, Pro card
│   ├── SignForm/           — shared auth form layout
│   └── Tasks/             — TaskDialog, TaskItem, TaskFilters, TaskSearch, TasksSection
├── hooks/
│   ├── useMobile.ts       — breakpoint detection
│   └── useCustomDialog.ts — open/close state helper
├── layout/
│   ├── AuthLayout.tsx     — wraps public auth routes
│   ├── PrivateLayout.tsx  — sidebar + outlet for protected routes
│   ├── CustomSidebarTrigger.tsx
│   └── QuickAddButton.tsx — floating action button
├── lib/
│   ├── store/
│   │   ├── store.ts       — configureStore, persistedReducer
│   │   ├── hooks.ts       — useAppDispatch, useAppSelector, useAppUser
│   │   ├── index.ts       — all store exports (single import point)
│   │   ├── utils/
│   │   │   └── invalidateTags.ts  — invalidateApiTags() helper
│   │   └── slices/
│   │       ├── baseQuery.ts       — fetchBaseQuery + mutex reauth logic
│   │       ├── auth/              — authApi (RTK Query) + authSlice (user state)
│   │       ├── area/              — areaApi
│   │       ├── project/           — projectApi
│   │       ├── tasks/             — taskApi
│   │       └── bucket/            — bucketApi
│   ├── types/
│   │   ├── interfaces/index.ts    — IArea, IProject, ITask, IBucket, IUser, etc.
│   │   ├── constants.ts           — TaskStatus, TaskPriority, PROJECT_STATUS, GENERAL_AREA, etc.
│   │   ├── endpoints.ts           — AREA_API, PROJECT_API, TASKS_API, BUCKET_API, AUTH_API
│   │   ├── icons.ts               — IconId union type + ICON_IDS array
│   │   └── index.ts               — barrel export
│   └── utils/
│       └── utils/
│           ├── schemas.ts         — all Zod schemas + inferred FormData types
│           ├── messages.ts        — ToastMessages const object
│           ├── helpers.ts
│           └── get-icons.ts
├── pages/
│   ├── auth/              — SignIn, SignUp, ForgotPassword, ResetPassword
│   ├── quick-access/      — Bucket, Today, Tomorrow, NextSevenDays
│   ├── project/           — ProjectView
│   ├── Profile.tsx
│   ├── ErrorPage.tsx
│   ├── HelpAndInformation.tsx
│   ├── PrivacyPolicy.tsx
│   └── TermsOfService.tsx
└── router.tsx             — useRoutes config; PrivateRoutes guard reads useAppUser()

__tests__/
├── setup.ts               — mocks: matchMedia, localStorage, sessionStorage, IntersectionObserver, ResizeObserver
└── renderComponent.tsx    — test render helper
```

---

## Routes

```
/ (PrivateLayout — requires user in Redux auth slice)
  /                       → redirect to /quick-access/Bucket
  /quick-access/Bucket
  /quick-access/today
  /quick-access/tomorrow
  /quick-access/next-7-days
  /projects/:projectId
  /projects/new           → placeholder <div>
  /profile
  /terms-of-service
  /privacy-policy
  /help-information

/ (AuthLayout — public)
  /sign-in
  /sign-up
  /forgot-password
  /reset-password

* → ErrorPage
```

Auth guard is in `PrivateRoutes` (`src/router.tsx`): reads `useAppUser()` — if `null`, redirects to `/sign-in` with `state.from` for post-login redirect.

---

## API & Auth

**Base URL:** `http://localhost:8080/` — hardcoded in `src/lib/store/slices/baseQuery.ts`

**Token flow:**

1. `localStorage.getItem('authToken')` → set as `Authorization: Bearer <token>` on every request
2. On `401`: `async-mutex` ensures only one refresh fires — calls `POST /auth/refresh-token`
3. Refresh failure → `localStorage.removeItem('authToken')` + `window.location.href = '/sign-in'`
4. Refresh success → retry original request

**Endpoint constants** (`src/lib/types/endpoints.ts`):

```
AUTH_API     /auth/*, /users/profile
AREA_API     /areas
PROJECT_API  /projects
TASKS_API    /tasks
BUCKET_API   /bucket
```

---

## State Management

**RTK Query for all server state.** Never `useEffect` + `fetch`.

All API hooks are imported from `@/lib/store` (the barrel), not from the slice files directly.

```typescript
// ✅ correct
import { useGetAreasQuery, useCreateProjectMutation } from '@/lib/store';

// ❌ wrong — import from barrel
import { areaApi } from '@/lib/store/slices/area/areaApi';
```

**Tag invalidation** — use the typed helper, not direct dispatch:

```typescript
import { invalidateApiTags } from '@/lib/store';
import { areaApi } from '@/lib/store';

invalidateApiTags(dispatch, areaApi, ['Area'] as const);
```

**Store hooks:**

```typescript
const dispatch = useAppDispatch(); // typed AppDispatch
const value = useAppSelector(s => s.auth); // typed RootState
const user = useAppUser(); // shorthand for auth.user
```

**Persistence:** only the `auth` reducer key is persisted. RTK Query cache is never persisted. Changing a `reducerPath` will cause a one-time cache miss on first load — harmless.

---

## Data Types

All in `src/lib/types/interfaces/index.ts`:

```typescript
IArea      { id: number; name: string; icon?: IconId; sortOrder?: number; userId: number; createdAt: string; updatedAt: string; projects?: IProject[] }
IProject   { id: number; name: string; area: IArea; areaId: number; status: 'active'|'archived'|'completed'; icon?: IconId; sortOrder?: number; dueDate?: string; isFavorite?: boolean; userId: number; createdAt: string; updatedAt: string }
ITask      { id: number; name: string; projectId: number; description: string; status: TaskStatus; priority: TaskPriority; dueDate?: string; estimatedMinutes?: number; url?: string; recurrence?: ITaskRecurrence; notifications?: ITaskNotification[]; sortOrder?: number; completedAt?: string; createdAt: string; updatedAt: string }
IBucket    { id: number; userId: number; content: string; processingResult?: ProcessingResult; projectId?: number; createdTaskId?: number; processedAt?: string; createdAt: string; updatedAt: string }
IUser      { id: number; email: string; firstName: string; lastName: string; username: string; theme: 'light'|'dark'; imageUrl?: string; status: 'premium'|'regular' }
```

Key constants from `src/lib/types/constants.ts`:

```typescript
TaskStatus       { TODO, IN_PROGRESS, DONE }
TaskPriority     { LOW, MEDIUM, HIGH }
TaskSortField    { DUE_DATE, PRIORITY, NAME, CREATED_AT }
PROJECT_STATUS   { ACTIVE, COMPLETED, ARCHIVED }
GENERAL_AREA     = 'general'
USER_STATUS      { PREMIUM, REGULAR }
ProcessingResult 'task' | 'note' | 'trash'
```

---

## Forms

All schemas in `src/lib/utils/utils/schemas.ts`, exported from `src/lib/utils/index.ts`.

```typescript
import { projectSchema, type ProjectFormData } from '@/lib/utils';

const form = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
```

Available schemas:

- `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `projectSchema` — has `areaId` field
- `areaSchema`, `updateAreaSchema`
- `taskSchema`, `bucketSchema`, `processBucketSchema`

Password rules (enforced by `passwordSchema`): min 8, max 20, at least one number + one lowercase + one uppercase.

Username rules: min 3, max 20, alphanumeric only.

---

## Toast Messages

Use `sonner`, import `ToastMessages` for consistency:

```typescript
import { toast } from 'sonner';
import { ToastMessages } from '@/lib/utils';

toast.success(ToastMessages.PROJECT_CREATED);
toast.error(ToastMessages.UNEXPECTED_ERROR);
```

`ToastMessages` is defined in `src/lib/utils/utils/messages.ts`. It covers auth, project, task, category, bucket, rate-limit, and general error cases.

**Never** `import { toast } from 'react-toastify'` — it's an unused dep that needs to be removed.

---

## Component Conventions

**Field components** — always use existing fields inside dialogs; don't reinvent:

- `<NameField control={form.control} />`
- `<PriorityField control={form.control} />`
- `<DueDateField control={form.control} />`
- `<IconField control={form.control} />`
- etc.

**Dialog shells:**

- `<FormDialog>` — create/edit with a form
- `<ConfirmDialog>` — destructive yes/no
- `<CustomDialog>` — freeform

**Lists:**

- `<AnimatedListItem>` — Framer Motion `layout` + `AnimatePresence` for list items
- `<ListItemCard>` — standard card row
- `<ItemActionsMenu>` — three-dot `DropdownMenu` for row actions

**Drag and drop:**

- `<DragAndDropContext>` in `src/components/DragAndDropContext/` wraps `DndContext` from dnd-kit
- Droppable areas use id pattern `'area-${areaId}'`
- Handles `updateProject` to change `areaId` on drop

**Adding new shadcn/ui components:**

```bash
npx shadcn@latest add <name>
# outputs to src/components/ui/, updates package.json
```

---

## ESLint Rules (enforced, not optional)

From `eslint.config.js`:

| Rule                                 | Level   | Notes                           |
| ------------------------------------ | ------- | ------------------------------- |
| `@typescript-eslint/no-explicit-any` | `error` | No exceptions                   |
| `@typescript-eslint/no-unused-vars`  | `warn`  | prefix `_` to suppress          |
| `simple-import-sort/imports`         | `error` | Auto-fix with `pnpm lint --fix` |
| `import/no-duplicates`               | `error` |                                 |
| `import/first`                       | `error` |                                 |

⚠️ React hooks rules (`eslint-plugin-react-hooks`) currently only apply to `apps/web/**` — a leftover from the old monorepo structure. They don't apply to `src/**` yet. This is a known bug to fix in `eslint.config.js`.

**Import order** (enforced by `simple-import-sort`):

1. `react`, `react-dom`, `react-native`
2. `expo`, `@react-navigation`
3. Other external packages (`@?\\w`)
4. Internal `@/` aliases
5. Parent `../`
6. Same-folder `./`

---

## Testing

```bash
pnpm test              # vitest run (single pass)
pnpm test:watch        # vitest (watch mode)
pnpm test:ui           # vitest --ui (browser UI at localhost)
pnpm test:coverage     # vitest run --coverage (v8, outputs text/json/html/lcov/cobertura)
```

**Setup** (`__tests__/setup.ts`): stubs `window.matchMedia`, `localStorage`, `sessionStorage`, `IntersectionObserver`, `ResizeObserver`.

**Render helper** (`__tests__/renderComponent.tsx`): wraps `render` with Redux store + Router providers.

**MSW** is available for API mocking in integration tests.

**Test files**: co-located as `ComponentName.test.tsx` next to the component.

**Vitest config** (`vite.config.ts`): `environment: 'jsdom'`, globals enabled, alias `@/` → `src/`.

---

## Storybook

```bash
pnpm storybook     # → http://localhost:6006
pnpm build-storybook
```

Stories are co-located: `src/components/ComponentName/ComponentName.stories.tsx` (all components except `src/components/ui/`).

Storybook infrastructure:

- `src/stories/store/storybookStore.ts` — persist-free Redux store for stories
- `src/stories/decorators/withStoryProviders.tsx` — global decorator
- `src/stories/helpers/StoryFormWrapper.tsx` — generic render-prop for form field stories
- `src/stories/mocks/index.ts` — typed mock factories

---

## Known Issues (TODO — Sprint 01)

These exist in the codebase right now and need to be fixed:

1. **`eslint.config.js` React rules scope** — `react-hooks` and `react-refresh` plugins only apply to `apps/web/**` (dead path). Move to `src/**`.

2. **`react-toastify`** — in `package.json`, not used anywhere. Remove.

3. **Empty directories** — `apps/` and `packages/` are leftover monorepo scaffolding with no source code. Delete.

---

## Local Dev

```bash
# Prerequisites: Node 20+, pnpm 10.18.3+, nicoflow-api running on :3001
pnpm install
pnpm dev           # Vite dev server → http://localhost:5173
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
| `ci.yml`                | push to any branch, PR to `staging` | lint → type-check → test (parallel) → build |
| `deploy-staging.yml`    | push to `staging`                   | install → build → Vercel staging            |
| `deploy-production.yml` | `workflow_dispatch` (type "DEPLOY") | install → build → Vercel production         |

**Secrets required:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_STAGING`, `VERCEL_PROJECT_ID_PRODUCTION`

Deployment: Vercel. `vercel.json` at repo root handles SPA fallback routing.

**Branching strategy:**

```
feature/NIC-XXXX-description  →  PR to staging  →  merge  →  Vercel staging auto-deploys
staging                        →  PR to main     →  merge  →  manual production deploy
```

- `feature/*` — all story/task work happens here; branch name includes Jira key
- `staging` — integration branch; auto-deploys to `https://staging.nicoflow.app` on every merge
- `main` — production-stable; only updated via PR from `staging`; deployed manually via `workflow_dispatch`
