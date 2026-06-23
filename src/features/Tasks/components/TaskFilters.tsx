import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  taskCounts: {
    all: number;
    inbox: number;
    active: number;
    done: number;
    cancelled: number;
  };
}

const TaskFilters = ({ activeFilter, onFilterChange, taskCounts }: TaskFiltersProps) => {
  const { t } = useTranslation('task');

  const filters = [
    { value: 'all', labelKey: 'filters.all', countKey: 'all' },
    { value: TaskStatus.INBOX, labelKey: 'filters.inbox', countKey: 'inbox' },
    { value: TaskStatus.ACTIVE, labelKey: 'filters.active', countKey: 'active' },
    { value: TaskStatus.DONE, labelKey: 'filters.done', countKey: 'done' },
    { value: TaskStatus.CANCELLED, labelKey: 'filters.cancelled', countKey: 'cancelled' },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
      {filters.map(filter => {
        const count = taskCounts[filter.countKey];
        const isActive = activeFilter === filter.value;

        return (
          <motion.button
            key={filter.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
              'border whitespace-nowrap flex-shrink-0',
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            {t(filter.labelKey)}
            <Badge
              variant={isActive ? 'secondary' : 'outline'}
              className={cn(
                'h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-xs',
                isActive && 'bg-primary-foreground/20 text-primary-foreground'
              )}
            >
              {count}
            </Badge>
          </motion.button>
        );
      })}
    </div>
  );
};

export default TaskFilters;
