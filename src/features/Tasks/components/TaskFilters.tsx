import { useTranslation } from 'react-i18next';

import { ENERGY_OPTIONS } from '@/components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskEnergy, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface TaskCounts {
  all: number;
  inbox: number;
  active: number;
  someday: number;
  done: number;
  cancelled: number;
}

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activeEnergy: TaskEnergy | 'all';
  onEnergyChange: (energy: TaskEnergy | 'all') => void;
  taskCounts: TaskCounts;
}

const TaskFilters = ({ activeFilter, onFilterChange, activeEnergy, onEnergyChange, taskCounts }: TaskFiltersProps) => {
  const { t } = useTranslation(['task', 'common']);

  const statusFilters = [
    { value: 'all', labelKey: 'filters.all', countKey: 'all' },
    { value: TaskStatus.INBOX, labelKey: 'filters.inbox', countKey: 'inbox' },
    { value: TaskStatus.ACTIVE, labelKey: 'filters.active', countKey: 'active' },
    { value: TaskStatus.SOMEDAY, labelKey: 'filters.someday', countKey: 'someday' },
    { value: TaskStatus.DONE, labelKey: 'filters.done', countKey: 'done' },
    { value: TaskStatus.CANCELLED, labelKey: 'filters.cancelled', countKey: 'cancelled' },
  ] as const;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1"
        role="tablist"
        aria-label={t('filters.all')}
      >
        {statusFilters.map(filter => {
          const isActive = activeFilter === filter.value;
          const count = taskCounts[filter.countKey];
          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(filter.value)}
              data-testid={`task-filter-${filter.value}`}
              className={cn(
                'inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(filter.labelKey)}
              <span
                className={cn('text-xs tabular-nums', isActive ? 'text-foreground/60' : 'text-muted-foreground/60')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Energy: a compact dropdown instead of a second full chip row. */}
      <Select value={activeEnergy} onValueChange={value => onEnergyChange(value as TaskEnergy | 'all')}>
        <SelectTrigger
          className="h-9 w-full sm:w-40 flex-shrink-0"
          data-testid="task-energy-filter"
          aria-label={t('filters.energyLabel')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.energyAll')}</SelectItem>
          {ENERGY_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
            <SelectItem key={value} value={value} data-testid={`task-energy-filter-${value}`}>
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t(labelKey)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskFilters;
