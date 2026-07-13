import { useState } from 'react';

import { FolderIcon, Layers3Icon, ListTodoIcon, Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useDebouncedValue } from '@/hooks';
import type { IAreaResult, IProjectResult, ITaskResult } from '@/lib/store';
import { useSearchQuery } from '@/lib/store';

type SearchResultUnion =
  | { kind: 'task'; item: ITaskResult }
  | { kind: 'project'; item: IProjectResult }
  | { kind: 'area'; item: IAreaResult };

export type SearchSelectPayload = SearchResultUnion;

type SearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (result: SearchSelectPayload) => void;
};

export const SearchCommand = ({ open, onOpenChange, onSelect }: SearchCommandProps) => {
  const { t } = useTranslation('common');
  const [inputValue, setInputValue] = useState('');
  const debouncedQ = useDebouncedValue(inputValue, 200);

  const isQueryReady = debouncedQ.trim().length >= 2;

  const { data, isFetching } = useSearchQuery(debouncedQ.trim(), { skip: !isQueryReady });

  const hasTasks = (data?.tasks.length ?? 0) > 0;
  const hasProjects = (data?.projects.length ?? 0) > 0;
  const hasAreas = (data?.areas.length ?? 0) > 0;
  const hasAnyResult = hasTasks || hasProjects || hasAreas;

  const handleSelect = (payload: SearchSelectPayload) => {
    onSelect?.(payload);
    onOpenChange(false);
    setInputValue('');
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setInputValue('');
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} label={t('actions.search')} shouldFilter={false}>
      <CommandInput
        value={inputValue}
        onValueChange={setInputValue}
        placeholder={t('search.placeholder')}
        data-testid="search-input"
      />
      <CommandList>
        {/* Show loading indicator while debounced query is in-flight (≥2 chars). */}
        {isQueryReady && isFetching && (
          <div
            className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
            data-testid="search-loading"
          >
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>{t('search.loading')}</span>
          </div>
        )}

        {/* Empty state once the query settled and returned nothing. */}
        {isQueryReady && !isFetching && !hasAnyResult && (
          <CommandEmpty data-testid="search-empty">{t('search.empty')}</CommandEmpty>
        )}

        {hasTasks && !isFetching && (
          <CommandGroup heading={t('search.groupTasks')} data-testid="group-tasks">
            {data!.tasks.map(task => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}`}
                onSelect={() => handleSelect({ kind: 'task', item: task })}
                data-testid={`result-task-${task.id}`}
              >
                <ListTodoIcon className="text-muted-foreground" />
                <span className="flex-1 truncate">{task.title}</span>
                {task.projectName && <span className="text-xs text-muted-foreground">{task.projectName}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasTasks && hasProjects && !isFetching && <CommandSeparator />}

        {hasProjects && !isFetching && (
          <CommandGroup heading={t('search.groupProjects')} data-testid="group-projects">
            {data!.projects.map(project => (
              <CommandItem
                key={project.id}
                value={`project-${project.id}`}
                onSelect={() => handleSelect({ kind: 'project', item: project })}
                data-testid={`result-project-${project.id}`}
              >
                <FolderIcon className="text-muted-foreground" />
                <span className="flex-1 truncate">{project.name}</span>
                {project.areaName && <span className="text-xs text-muted-foreground">{project.areaName}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(hasTasks || hasProjects) && hasAreas && !isFetching && <CommandSeparator />}

        {hasAreas && !isFetching && (
          <CommandGroup heading={t('search.groupAreas')} data-testid="group-areas">
            {data!.areas.map(area => (
              <CommandItem
                key={area.id}
                value={`area-${area.id}`}
                onSelect={() => handleSelect({ kind: 'area', item: area })}
                data-testid={`result-area-${area.id}`}
              >
                <Layers3Icon className="text-muted-foreground" />
                <span className="flex-1 truncate">{area.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
