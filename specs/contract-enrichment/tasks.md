# Tasks — contract-enrichment (nicoflow-frontend)

Fix this app's call sites wherever the shared types were wrong. Nothing here
starts until `nicoflow-shared` has published its corrected types for the domain
in question.

79 files import the shared interfaces, clustered by feature. The interfaces
themselves stay hand-written and stay in `nicoflow-shared` — this list is about
the call sites that break once those interfaces tell the truth.

**No alias shims, no casts.** If `tsc` complains, the call site is wrong — fix
it. Never `as`, never re-declare the interface locally. Those defeat the point:
the compiler error _is_ the contract check.

Expect real errors, not just renames. A field that was `status?: string` becomes
`status: 'active' | 'done' | 'cancelled'`, so a comparison against a value that
was never valid stops compiling. A field that gains `| null` forces the null
case to be handled. Both are bugs being found — fix the logic rather than
widening the type back.

After each: `pnpm type-check && pnpm test`, and the touched feature's tests must
pass, not just compile.

## Planned

- [ ] Bump @nicoflow/shared to the version carrying the corrected types and confirm the app still compiles before any call-site work [ac:AC9] [files:package.json] [verify:pnpm install && pnpm type-check]

- [ ] Fix the Tasks feature (11 files) against the corrected task types [ac:AC9] [files:src/features/Tasks] [verify:pnpm type-check && pnpm vitest run src/features/Tasks]

- [ ] Fix the Calendar feature (12 files) [ac:AC9] [files:src/features/Calendar] [verify:pnpm type-check && pnpm vitest run src/features/Calendar]

- [ ] Fix the Habits feature (11 files) [ac:AC9] [files:src/features/Habits] [verify:pnpm type-check && pnpm vitest run src/features/Habits]

- [ ] Fix the Bucket feature (7 files) [ac:AC9] [files:src/features/Bucket] [verify:pnpm type-check && pnpm vitest run src/features/Bucket]

- [ ] Fix the Project and Area features (9 files) [ac:AC9] [files:src/features/Project,src/features/Area] [verify:pnpm type-check && pnpm vitest run src/features/Project src/features/Area]

- [ ] Fix the Notes feature (6 files) [ac:AC9] [files:src/features/Notes] [verify:pnpm type-check && pnpm vitest run src/features/Notes]

- [ ] Migrate TimeSpread, Focus, Rail and Search (15 files) [ac:AC9] [files:src/features/TimeSpread,src/features/Focus,src/features/Rail,src/features/Search] [verify:pnpm type-check && pnpm vitest run src/features/TimeSpread src/features/Focus src/features/Rail src/features/Search]

- [ ] Fix the remaining components, pages, lib and mocks (8 files) [ac:AC9] [files:src/components,src/pages,src/lib,src/mocks] [verify:pnpm type-check && pnpm test]

- [ ] Full sweep: no local re-declaration of a shared type remains, and no `as` cast was introduced to satisfy the compiler [ac:AC8,AC9] [verify:pnpm type-check && pnpm lint && pnpm test && ! grep -rqE "\b(ITask|IProject|IArea|IBucket|INote|IHabit|ISubtask)\b" src/]

## Discovered

_(the loop appends here — never reorder or delete the planned list above)_
