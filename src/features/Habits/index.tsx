import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useGetHabitsQuery } from '@/lib/store';
import type { IHabit } from '@/lib/types';

import { HabitFormDialog } from './components/HabitFormDialog';
import { HabitGrid } from './components/HabitGrid';
import { HabitsEmptyState } from './states/HabitsEmptyState';
import { HabitsErrorState } from './states/HabitsErrorState';
import { HabitsLoadingState } from './states/HabitsLoadingState';

// The habits board.
//
// Every habit is always visible, including ones not scheduled today — those are
// dimmed by the card rather than filtered out here. A habit that disappears on
// its off day reads as data loss, not as "not today".
export const HabitsView = () => {
  const { t } = useTranslation('habits');
  const { data: habits, isLoading, isError, refetch } = useGetHabitsQuery();

  // `undefined` opens the dialog in create mode; a habit opens it in edit mode.
  const [editing, setEditing] = useState<IHabit | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    setEditing(habits?.find(h => h.id === id));
    setDialogOpen(true);
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6" data-testid="habits-view">
      {/* h2, not h1: the shared EmptyState renders an h3, and the page shell
          already owns the h1 — an h1→h3 jump is a real heading-order failure. */}
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
        <Button onClick={openCreate} data-testid="habits-create">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('create')}
        </Button>
      </header>

      {isLoading ? (
        <HabitsLoadingState />
      ) : isError ? (
        <HabitsErrorState onRetry={() => void refetch()} />
      ) : habits && habits.length > 0 ? (
        <HabitGrid habits={habits} onOpen={openEdit} />
      ) : (
        <HabitsEmptyState onCreate={openCreate} />
      )}

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
    </section>
  );
};

export { HabitTodayStrip } from './components/HabitTodayStrip';
