import { motion } from 'framer-motion';

import { TaskStatus } from '@my-monorepo/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  taskCounts: {
    all: number;
    todo: number;
    inProgress: number;
    done: number;
  };
}

const filters = [
  { value: 'all', label: 'All', key: 'all' },
  { value: TaskStatus.TODO, label: 'To Do', key: 'todo' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', key: 'inProgress' },
  { value: TaskStatus.DONE, label: 'Done', key: 'done' },
];

const TaskFilters = ({ activeFilter, onFilterChange, taskCounts }: TaskFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
      {filters.map(filter => {
        const count = taskCounts[filter.key as keyof typeof taskCounts];
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
            {filter.label}
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
