import { CheckSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface TasksHeaderProps {
  taskCount: number;
  onAddTask?: () => void;
  /** False when a surrounding tab already names this section. */
  showTitle?: boolean;
}

const TasksHeader = ({ taskCount, onAddTask, showTitle = true }: TasksHeaderProps) => {
  const { t } = useTranslation('task');

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {showTitle ? (
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
        ) : (
          <span />
        )}

        {taskCount > 0 && (
          <Button
            onClick={onAddTask}
            data-testid="task-add-button"
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white w-full sm:w-auto"
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
