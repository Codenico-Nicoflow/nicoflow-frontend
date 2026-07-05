import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { ENERGY_OPTIONS } from '@/components';
import { Badge } from '@/components/ui/badge';
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

const chip = (isActive: boolean) =>
  cn(
    'inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
    'border whitespace-nowrap flex-shrink-0',
    isActive
      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
  );

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full" role="group" aria-label={t('filters.all')}>
        {statusFilters.map(filter => {
          const isActive = activeFilter === filter.value;
          return (
            <motion.button
              key={filter.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(filter.value)}
              data-testid={`task-filter-${filter.value}`}
              className={chip(isActive)}
            >
              {t(filter.labelKey)}
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className={cn(
                  'h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-xs',
                  isActive && 'bg-primary-foreground/20 text-primary-foreground'
                )}
              >
                {taskCounts[filter.countKey]}
              </Badge>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('common:fields.energyLabel')}>
        <button
          type="button"
          onClick={() => onEnergyChange('all')}
          data-testid="task-energy-filter-all"
          className={chip(activeEnergy === 'all')}
        >
          {t('filters.all')}
        </button>
        {ENERGY_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => onEnergyChange(value)}
            data-testid={`task-energy-filter-${value}`}
            className={chip(activeEnergy === value)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskFilters;
