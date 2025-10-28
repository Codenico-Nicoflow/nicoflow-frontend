import { CheckSquare, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface TasksHeaderProps {
  taskCount: number;
  onAddTask?: () => void;
}

const TasksHeader = ({ taskCount, onAddTask }: TasksHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}` : 'Manage your tasks'}
            </p>
          </div>
        </div>

        {taskCount > 0 && (
          <Button
            onClick={onAddTask}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  );
};

export default TasksHeader;
