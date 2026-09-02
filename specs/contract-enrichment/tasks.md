# Tasks — contract-enrichment (nicoflow-frontend)

Swap this app onto the generated types. Nothing here starts until
`nicoflow-shared` has published the generated type for the feature in question.

79 files import the hand-written interfaces, clustered by feature.

**No alias shims, no casts.** If `tsc` complains, the call site is wrong — fix
it. Never `as`, never re-declare the interface locally. Those defeat the point:
the compiler error _is_ the contract check.

Expect real errors, not just renames. A field that was `status?: string` becomes
`status: 'active' | 'done' | 'cancelled'`, so a comparison against a value that
was never valid will now fail to compile. That is a bug being found, not a
migration problem — fix the logic rather than widening the type.

After each: `pnpm type-check && pnpm test`, and the touched feature's tests must
pass, not just compile.

## Planned

- [ ] Bump @nicoflow/shared to the version carrying the generated types and confirm the app still compiles before any migration [ac:AC9] [files:package.json] [verify:pnpm install && pnpm type-check]

- [ ] Migrate the Tasks feature (11 files) to the generated task types [ac:AC9] [files:src/features/Tasks] [verify:pnpm type-check && pnpm vitest run src/features/Tasks]

- [ ] Migrate the Calendar feature (12 files) [ac:AC9] [files:src/features/Calendar] [verify:pnpm type-check && pnpm vitest run src/features/Calendar]

- [ ] Migrate the Habits feature (11 files) [ac:AC9] [files:src/features/Habits] [verify:pnpm type-check && pnpm vitest run src/features/Habits]

- [ ] Migrate the Bucket feature (7 files) [ac:AC9] [files:src/features/Bucket] [verify:pnpm type-check && pnpm vitest run src/features/Bucket]

- [ ] Migrate the Project and Area features (9 files) [ac:AC9] [files:src/features/Project,src/features/Area] [verify:pnpm type-check && pnpm vitest run src/features/Project src/features/Area]

- [ ] Migrate the Notes feature (6 files) [ac:AC9] [files:src/features/Notes] [verify:pnpm type-check && pnpm vitest run src/features/Notes]

- [ ] Migrate TimeSpread, Focus, Rail and Search (15 files) [ac:AC9] [files:src/features/TimeSpread,src/features/Focus,src/features/Rail,src/features/Search] [verify:pnpm type-check && pnpm vitest run src/features/TimeSpread src/features/Focus src/features/Rail src/features/Search]

- [ ] Migrate the remaining components, pages, lib and mocks (8 files) [ac:AC9] [files:src/components,src/pages,src/lib,src/mocks] [verify:pnpm type-check && pnpm test]

- [ ] Full sweep: no hand-written interface remains, no `as` cast or local re-declaration was introduced to satisfy the compiler [ac:AC8,AC9] [verify:pnpm type-check && pnpm lint && pnpm test && ! grep -rqE "\b(ITask|IProject|IArea|IBucket|INote|IHabit|ISubtask)\b" src/]

## Discovered

_(the loop appends here — never reorder or delete the planned list above)_
