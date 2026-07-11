import { useTranslation } from 'react-i18next';

import { ENERGY_OPTIONS } from '@/components';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
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

  const activeEnergyOption = ENERGY_OPTIONS.find(option => option.value === activeEnergy);
  const ActiveEnergyIcon = activeEnergyOption?.icon;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Status: one quiet segmented control; scrolls (with an edge fade) on narrow screens. */}
      <div className="relative min-w-0 [mask-image:linear-gradient(to_right,black,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]">
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1"
          role="tablist"
          aria-label={t('filters.all')}
        >
          {statusFilters.map(filter => {
            const isActive = activeFilter === filter.value;
            const count = taskCounts[filter.countKey];
            // Empty status filters are dimmed and unclickable so they don't lead to a dead view.
            const isEmpty = count === 0 && !isActive;
            return (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isEmpty}
                onClick={() => onFilterChange(filter.value)}
                data-testid={`task-filter-${filter.value}`}
                className={cn(
                  'inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                  isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  isEmpty && 'cursor-not-allowed opacity-40 hover:text-muted-foreground'
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
      </div>

      {/* Energy: a compact dropdown instead of a second full chip row. */}
      <Select value={activeEnergy} onValueChange={value => onEnergyChange(value as TaskEnergy | 'all')}>
        <SelectTrigger
          className="h-9 w-full flex-shrink-0 sm:w-40"
          data-testid="task-energy-filter"
          aria-label={t('filters.energyLabel')}
        >
          <span className="flex items-center gap-2">
            {ActiveEnergyIcon && <ActiveEnergyIcon className="h-3.5 w-3.5" aria-hidden />}
            {activeEnergyOption ? t(activeEnergyOption.labelKey) : t('filters.energyAll')}
          </span>
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
