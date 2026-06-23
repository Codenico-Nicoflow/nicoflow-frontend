import { CheckSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface TasksHeaderProps {
  taskCount: number;
  onAddTask?: () => void;
}

const TasksHeader = ({ taskCount, onAddTask }: TasksHeaderProps) => {
  const { t } = useTranslation('task');

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t('header.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {taskCount > 0 ? t('header.taskCount', { count: taskCount }) : t('header.manageTasksHint')}
            </p>
          </div>
        </div>

        {taskCount > 0 && (
          <Button
            onClick={onAddTask}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 me-2" />
            {t('header.addTask')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TasksHeader;
