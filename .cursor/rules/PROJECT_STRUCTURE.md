# Project Structure Rules

These rules define folder and file naming conventions for this repo.

## Feature folders

- Use PascalCase for feature and sub-feature folders: `Bucket`, `Category`, `Project`, `Tasks`, `Sidebar`, `SignForm`.
- Keep `components`, `states`, and `utils` directories lowercase.
- Inside `components/`, use PascalCase folders with `index.tsx` entry points.

## Example

- `src/features/Sidebar/Footer/SidebarFooter.tsx`
- `src/features/Sidebar/QuickAccess/QuickAccess.tsx`
- `src/features/Project/components/ProjectDialog/index.tsx`

## Exports

- Each feature should export from its feature `index.ts` or `index.tsx`.
