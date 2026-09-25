# nicoflow-frontend — Agent Guide

React 19 web application. Workspace rules are in `../AGENTS.md`; `nicoflow-api/SPEC.md` is canonical for the API contract. The live SPA is at repo-root `src/`; inspect `package.json` and workspace configuration before making assumptions about shared-package wiring.

## Stack and architecture

- Vite, TypeScript strict mode, Tailwind 4, Redux Toolkit/RTK Query, React Router, React Hook Form + Zod, Vitest, MSW, Playwright, Storybook.
- RTK Query is the server-state layer. Import hooks from `@/lib/store`; do not use `useEffect` plus `fetch` for API data.
- RTK endpoints unwrap `{data,error}` with `transformResponse`; error handling uses typed `error.code`.
- Use the shared `invalidateApiTags` helper, existing field/dialog components, `sonner` for toasts, and existing loading-state patterns.
- Auth access tokens remain in memory; refresh is single-flight and cookie-based. Never restore access-token localStorage behavior.
- IDs are strings. Keep client shapes aligned with API/SPEC. No explicit `any`.
- Follow existing feature-first module structure, import sorting, accessibility, RTL/Hebrew, and theme conventions.
- API contract changes require coordinated backend/client/SPEC updates. Check `../AGENTS.md` before cross-repo work.

## TDD and verification

For behavior changes, write the failing Vitest/RTL or Playwright test first, run it to confirm failure, implement the minimum fix, then refactor. Use MSW at the network boundary for API integration tests. Add/update Storybook stories for new reusable UI components.

```sh
pnpm type-check
pnpm lint
pnpm test
pnpm test:e2e # when user flows or routing change
pnpm build
```

## Workflow

Branches use `<type>/NIC-<ticket>-<short-desc>`, normally from `staging`; PRs target `staging`. `hotfix/*` starts at and targets `main`. API local development uses `http://localhost:8080/v1`. Consult current library documentation through Context7 before depending on third-party APIs.
