import { Skeleton } from '@/components/ui/skeleton';

// Shaped like the real page — title bar, toolbar strip, body — so the layout
// doesn't jump when the scalar lands. The editor is never mounted with
// placeholder content that then swaps: it mounts once, with the real document.
export const NoteEditorSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 sm:p-6" data-testid="note-editor-skeleton">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-8" />
    </div>
    <Skeleton className="h-9 w-2/3" />
    <div className="rounded-md border border-border">
      <Skeleton className="h-10 w-full rounded-b-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  </div>
);
