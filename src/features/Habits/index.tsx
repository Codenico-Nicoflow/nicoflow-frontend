import { useTranslation } from 'react-i18next';

import { useGetHabitsQuery } from '@/lib/store';

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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6" data-testid="habits-view">
      {/* h2, not h1: the shared EmptyState renders an h3, and the page shell
          already owns the h1 — an h1→h3 jump is a real heading-order failure. */}
      <header>
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
      </header>

      {isLoading ? (
        <HabitsLoadingState />
      ) : isError ? (
        <HabitsErrorState onRetry={() => void refetch()} />
      ) : habits && habits.length > 0 ? (
        <HabitGrid habits={habits} />
      ) : (
        <HabitsEmptyState />
      )}
    </section>
  );
};
