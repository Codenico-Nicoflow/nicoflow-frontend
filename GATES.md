# Gates — nicoflow-frontend

Measured 2026-09-01. The full suite is **88s** (330 files, 2145 tests), so it
runs every 5th iteration and before every push — not every iteration.

## Tier 1 — every iteration (~14s)

```bash
pnpm type-check          # tsc app + test projects             ~14s
```

This is the contract gate. If the API renamed a field and `@nicoflow/shared` was
regenerated, `tsc` fails here at every use site. That failure is the harness
working, not a nuisance — fix the call sites, never widen the type.

## Tier 1 — targeted tests

```bash
pnpm vitest run src/features/<Feature>/<File>.test.tsx
pnpm vitest related <changed-file.tsx>
```

## Tier 2 — every 5th iteration, and before every push (~105s)

```bash
pnpm type-check
pnpm lint
pnpm test                # 2145 tests, ~88s
```

## Tier 3 — exit gate (human-run)

```bash
pnpm build
pnpm test:e2e            # playwright
node -e "console.log(require.resolve('@nicoflow/shared'))"
# must resolve inside node_modules, NOT a symlink to ../nicoflow-shared
```

The resolve check matters: the inner loop runs against a linked local package,
so "it compiled" only proves it compiled against the working copy. The exit gate
must prove it compiles against what was actually published.

## Conventions the gate does not catch

- **No `any`.** `@typescript-eslint/no-explicit-any` is an error, but a `as
unknown as X` cast slips past. Don't.
- RTK Query for all server state. Never `useEffect + fetch`.
- Import API hooks from the `@/lib/store` barrel, not slice files.
- `sonner` for toasts. Never `react-toastify`.
- Every request site shows a loading state — skeleton for content, disabled +
  placeholder for pickers. A stale-data flash is a bug.
- Never `act()` in tests. Use `waitFor`.
- Reuse shared field/dialog components rather than reinventing them.
- Every new shared component needs a Storybook story.

## Contract failures — read this before "fixing" a type error

If `tsc` fails on a type from `@nicoflow/shared/generated`, the type is right and
the calling code is wrong. Fix the call site.

If you believe the generated type is genuinely wrong, that is an API bug: record
it in `blockers.md`. Do not cast, do not widen, do not re-declare the interface
locally. Those defeat the entire point of generating the types.

## Never

- Hand-edit anything under `node_modules/@nicoflow/shared`
- Cast around a generated type
- Delete or skip a test to make a gate pass
