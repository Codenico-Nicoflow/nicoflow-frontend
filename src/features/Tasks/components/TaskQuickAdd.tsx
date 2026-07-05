import { useState } from 'react';

import { Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { useCreateTaskMutation } from '@/lib/store';
import { getApiErrorCode, showErrorToast } from '@/lib/utils';

interface TaskQuickAddProps {
  projectId: string;
  onCreated?: () => void;
}

// Frictionless capture: one field, one keystroke. Title-only create — the
// backend applies the defaults (status inbox, priority/energy medium, rollsOver).
const TaskQuickAdd = ({ projectId, onCreated }: TaskQuickAddProps) => {
  const { t } = useTranslation('task');
  const [title, setTitle] = useState('');
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isLoading) return;
    try {
      await createTask({ projectId, title: trimmed }).unwrap();
      setTitle('');
      onCreated?.();
    } catch (error) {
      // Plan limit gets the on-brand nudge, not a generic error: only live
      // (inbox/active) tasks count, so Someday and Done are always free.
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        toast.error(t('quickAdd.planLimit'));
        return;
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <div className="relative mb-6">
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="h-4 w-4" aria-hidden />
        )}
      </span>
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={t('quickAdd.placeholder')}
        aria-label={t('quickAdd.label')}
        data-testid="task-quick-add"
        className="ps-9"
        disabled={isLoading}
        maxLength={255}
      />
    </div>
  );
};

export default TaskQuickAdd;
