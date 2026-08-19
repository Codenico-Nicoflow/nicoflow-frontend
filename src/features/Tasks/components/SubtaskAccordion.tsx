import { useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { OptionalBadge } from '@/components/OptionalBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useUpdateSubtaskMutation,
} from '@/lib/store';
import { showErrorToast } from '@/lib/utils';

interface SubtaskAccordionProps {
  taskId: string;
}

/**
 * Subtask list for an existing task: rows ordered by position, a checkbox to
 * toggle done, an add input, and a per-row delete. All writes go through the
 * subtask endpoints and re-fetch via the per-task Subtask tag.
 */
export const SubtaskAccordion = ({ taskId }: SubtaskAccordionProps) => {
  const { t } = useTranslation('task');
  const { data: subtasks = [], isLoading } = useGetSubtasksQuery(taskId);
  const [createSubtask, { isLoading: isCreating }] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();

  const [newTitle, setNewTitle] = useState('');

  const ordered = [...subtasks].sort((a, b) => a.position - b.position);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createSubtask({ taskId, title }).unwrap();
      setNewTitle('');
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleToggle = async (id: string, done: boolean) => {
    try {
      await updateSubtask({ taskId, id, done }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubtask({ taskId, id }).unwrap();
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <div className="space-y-2" data-testid="subtask-accordion">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        {t('subtasks.title')}
        <OptionalBadge />
      </p>

      {!isLoading && ordered.length === 0 && (
        <p className="text-sm text-muted-foreground" data-testid="subtask-empty">
          {t('subtasks.empty')}
        </p>
      )}

      <ul className="space-y-1">
        {ordered.map(subtask => (
          <li
            key={subtask.id}
            data-testid={`subtask-row-${subtask.id}`}
            className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5"
          >
            <Checkbox
              checked={subtask.done}
              onCheckedChange={checked => handleToggle(subtask.id, checked === true)}
              data-testid={`subtask-checkbox-${subtask.id}`}
              aria-label={subtask.title}
            />
            <span className={subtask.done ? 'flex-1 text-sm text-muted-foreground line-through' : 'flex-1 text-sm'}>
              {subtask.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(subtask.id)}
              data-testid={`subtask-delete-${subtask.id}`}
              aria-label={t('subtasks.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder={t('subtasks.addPlaceholder')}
          data-testid="subtask-add-input"
          className="h-9"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleAdd()}
          disabled={isCreating || !newTitle.trim()}
          data-testid="subtask-add-button"
        >
          <Plus className="h-4 w-4" />
          {t('subtasks.add')}
        </Button>
      </div>
    </div>
  );
};
