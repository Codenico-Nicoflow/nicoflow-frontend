import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import TaskItem from './TaskItem';

interface SortableTaskItemProps {
  task: ITask;
  index: number;
  onEdit: (task: ITask) => void;
  onDelete: (taskId: string) => void;
  /** Fired when the checkbox flips the status, so a filtered list can keep the row. */
  onStatusToggle?: (taskId: string) => void;
}

// Sortable wrapper around TaskItem: dnd-kit transform lives on this outer div,
// drag starts only from the grip handle so the checkbox/menu stay clickable.
const SortableTaskItem = ({ task, index, onEdit, onDelete, onStatusToggle }: SortableTaskItemProps) => {
  const { t } = useTranslation('task');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-80')}
    >
      <TaskItem
        task={task}
        index={index}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusToggle={onStatusToggle}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            aria-label={t('reorder.handle')}
            data-testid={`task-drag-${task.id}`}
            className="p-1 -ms-1 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        }
      />
    </div>
  );
};

export default SortableTaskItem;
