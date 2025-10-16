import type { ITask } from '@my-monorepo/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskBadgesProps {
  task: ITask;
}

const TaskBadges = ({ task }: TaskBadgesProps) => {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={cn('text-xs font-medium')}>
        {dateConfig?.formattedDate}
        <Clock className="h-3 w-3 mr-1.5" />
      </Badge>
    </div>
  );
};

export default TaskBadges;
