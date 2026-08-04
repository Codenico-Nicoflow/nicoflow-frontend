import { useState } from 'react';

import {
  ChevronRightIcon,
  ClockIcon,
  CornerDownLeftIcon,
  FolderIcon,
  Layers3Icon,
  ListTodoIcon,
  Loader2Icon,
  NotebookPenIcon,
  SparklesIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebouncedValue } from '@/hooks';
import type { IAreaResult, INoteResult, IProjectResult, ITaskResult } from '@/lib/store';
import { useSearchQuery } from '@/lib/store';
import { cn } from '@/lib/utils';

import { highlightMatch } from './highlightMatch';

type SearchResultUnion =
  | { kind: 'task'; item: ITaskResult }
  | { kind: 'project'; item: IProjectResult }
  | { kind: 'area'; item: IAreaResult }
  | { kind: 'note'; item: INoteResult };

export type SearchSelectPayload = SearchResultUnion;

type SearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (result: SearchSelectPayload) => void;
  /** Recent search terms shown when the input is empty. */
  recent?: string[];
  /** Called when the user selects a recent term; should re-run that search. */
  onRecentSelect?: (term: string) => void;
};

// One tinted tile per result kind so the eye sorts types before reading text.
const TILE = {
  task: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  project: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  area: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  note: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  recent: 'bg-muted text-muted-foreground',
} as const;

type RowProps = {
  icon: React.ReactNode;
  tile: keyof typeof TILE;
  title: string;
  meta?: string;
  value: string;
  onSelect: () => void;
  testId: string;
  /** Query to highlight inside the title; omit for non-search rows (e.g. recent). */
  query?: string;
};

const ResultRow = ({ icon, tile, title, meta, value, onSelect, testId, query }: RowProps) => (
  <CommandItem value={value} onSelect={onSelect} data-testid={testId} className="group">
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TILE[tile])}>{icon}</span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium text-foreground">{query ? highlightMatch(title, query) : title}</span>
      {meta && <span className="truncate text-xs text-muted-foreground">{meta}</span>}
    </span>
    <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-colors group-data-[selected=true]:text-muted-foreground rtl:rotate-180" />
  </CommandItem>
);

export const SearchCommand = ({ open, onOpenChange, onSelect, recent = [], onRecentSelect }: SearchCommandProps) => {
  const { t } = useTranslation('common');
  const [inputValue, setInputValue] = useState('');
  const debouncedQ = useDebouncedValue(inputValue, 200);

  const isQueryReady = debouncedQ.trim().length >= 2;
  const isEmpty = inputValue.trim().length === 0;

  const { data, isFetching } = useSearchQuery(debouncedQ.trim(), { skip: !isQueryReady });

  const tasks = data?.tasks ?? [];
  const projects = data?.projects ?? [];
  const areas = data?.areas ?? [];
  // Notes are a new group in the response (E-054). A UI that doesn't read it
  // drops results silently — nothing errors, they just never appear.
  const notes = data?.notes ?? [];
  const hasAnyResult = tasks.length + projects.length + areas.length + notes.length > 0;

  const close = () => {
    onOpenChange(false);
    setInputValue('');
  };

  const handleSelect = (payload: SearchSelectPayload) => {
    onSelect?.(payload);
    close();
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setInputValue('');
  };

  const handleRecentSelect = (term: string) => {
    onRecentSelect?.(term);
    setInputValue(term);
  };

  const count = (n: number) => (
    <span className="ms-2 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
      {n}
    </span>
  );

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} label={t('actions.search')} shouldFilter={false}>
      <CommandInput
        value={inputValue}
        onValueChange={setInputValue}
        placeholder={t('search.placeholder')}
        data-testid="search-input"
      />

      <CommandList>
        {/* Landing state: empty input, nothing recent — an invitation, not a void. */}
        {isEmpty && recent.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center" data-testid="search-hint">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">{t('search.hintTitle')}</p>
            <p className="max-w-[22rem] text-xs text-muted-foreground">{t('search.hintBody')}</p>
          </div>
        )}

        {/* Recent searches when input is empty. */}
        {isEmpty && recent.length > 0 && (
          <CommandGroup heading={t('search.groupRecent')} data-testid="group-recent">
            {recent.map(term => (
              <ResultRow
                key={term}
                tile="recent"
                icon={<ClockIcon className="h-4 w-4" />}
                title={term}
                value={`recent-${term}`}
                onSelect={() => handleRecentSelect(term)}
                testId={`result-recent-${term}`}
              />
            ))}
          </CommandGroup>
        )}

        {/* Loading — the palette owns its own busy state, no stale flash. */}
        {isQueryReady && isFetching && (
          <div
            className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"
            data-testid="search-loading"
          >
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>{t('search.loading')}</span>
          </div>
        )}

        {isQueryReady && !isFetching && !hasAnyResult && (
          <CommandEmpty data-testid="search-empty" className="px-6 py-14 text-sm text-muted-foreground">
            {t('search.empty', { query: debouncedQ.trim() })}
          </CommandEmpty>
        )}

        {tasks.length > 0 && !isFetching && (
          <CommandGroup
            heading={
              <>
                {t('search.groupTasks')}
                {count(tasks.length)}
              </>
            }
            data-testid="group-tasks"
          >
            {tasks.map(task => (
              <ResultRow
                key={task.id}
                tile="task"
                icon={<ListTodoIcon className="h-4 w-4" />}
                title={task.title}
                meta={task.projectName || undefined}
                value={`task-${task.id}`}
                onSelect={() => handleSelect({ kind: 'task', item: task })}
                testId={`result-task-${task.id}`}
                query={debouncedQ.trim()}
              />
            ))}
          </CommandGroup>
        )}

        {projects.length > 0 && !isFetching && (
          <CommandGroup
            heading={
              <>
                {t('search.groupProjects')}
                {count(projects.length)}
              </>
            }
            data-testid="group-projects"
          >
            {projects.map(project => (
              <ResultRow
                key={project.id}
                tile="project"
                icon={<FolderIcon className="h-4 w-4" />}
                title={project.name}
                meta={project.areaName || undefined}
                value={`project-${project.id}`}
                onSelect={() => handleSelect({ kind: 'project', item: project })}
                testId={`result-project-${project.id}`}
                query={debouncedQ.trim()}
              />
            ))}
          </CommandGroup>
        )}

        {areas.length > 0 && !isFetching && (
          <CommandGroup
            heading={
              <>
                {t('search.groupAreas')}
                {count(areas.length)}
              </>
            }
            data-testid="group-areas"
          >
            {areas.map(area => (
              <ResultRow
                key={area.id}
                tile="area"
                icon={<Layers3Icon className="h-4 w-4" />}
                title={area.name}
                value={`area-${area.id}`}
                onSelect={() => handleSelect({ kind: 'area', item: area })}
                testId={`result-area-${area.id}`}
                query={debouncedQ.trim()}
              />
            ))}
          </CommandGroup>
        )}

        {notes.length > 0 && !isFetching && (
          <CommandGroup
            heading={
              <>
                {t('search.groupNotes')}
                {count(notes.length)}
              </>
            }
            data-testid="group-notes"
          >
            {notes.map(note => (
              <ResultRow
                key={note.id}
                tile="note"
                icon={<NotebookPenIcon className="h-4 w-4" />}
                title={note.title}
                // Server-derived plain text; an orphaned note's projectName is
                // an empty string, so prefer it only when it's actually set.
                meta={note.projectName || note.excerpt}
                value={`note-${note.id}`}
                onSelect={() => handleSelect({ kind: 'note', item: note })}
                testId={`result-note-${note.id}`}
                query={debouncedQ.trim()}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer: keyboard affordances so the palette teaches itself. */}
      <div className="flex items-center gap-4 border-t border-border/60 px-5 py-2.5 text-[0.7rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CornerDownLeftIcon className="h-3 w-3" />
          {t('search.hintOpen')}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans">esc</kbd>
          {t('search.hintClose')}
        </span>
      </div>
    </CommandDialog>
  );
};
