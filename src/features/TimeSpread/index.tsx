import { useMemo, useState } from 'react';

import type { ITask } from '@nicoflow/shared/types';
import { ActiveTab } from '@nicoflow/shared/types';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { HabitTodayStrip } from '@/features/Habits';
import { TaskDialog, TasksLoadingState } from '@/features/Tasks';
import { useGetTimeSpreadQuery } from '@/lib/store';

import TimeSpreadList from './components/TimeSpreadList';
import TimeSpreadTabs from './components/TimeSpreadTabs';
import { groupByDay } from './utils';

interface TimeSpreadViewProps {
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
}

const TimeSpreadView = ({ activeTab }: TimeSpreadViewProps) => {
  const { t } = useTranslation('task');
  const { data, isLoading } = useGetTimeSpreadQuery();

  const [editTask, setEditTask] = useState<ITask | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (task: ITask) => {
    setEditTask(task);
    setIsDialogOpen(true);
  };

  const flat =
    activeTab === ActiveTab.TODAY ? data?.today : activeTab === ActiveTab.TOMORROW ? data?.tomorrow : undefined;
  const weekGroups = useMemo(
    () => (activeTab === ActiveTab.WEEK ? groupByDay(data?.thisWeek ?? []) : []),
    [activeTab, data?.thisWeek]
  );

  const isEmpty = activeTab === ActiveTab.WEEK ? weekGroups.length === 0 : (flat?.length ?? 0) === 0;

  const content = isLoading ? (
    <div data-testid="timespread-loading">
      <TasksLoadingState />
    </div>
  ) : isEmpty ? (
    <EmptyState
      icon={CalendarDays}
      title={t(`timeSpread.${activeTab}.emptyTitle`)}
      description={t(`timeSpread.${activeTab}.emptyDescription`)}
      data-testid="timespread-empty"
    />
  ) : activeTab === ActiveTab.WEEK ? (
    <div className="space-y-8" data-testid="timespread-week">
      {weekGroups.map(group => (
        <section key={group.key} data-testid={`timespread-day-${group.key}`} className="space-y-3 sm:space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {format(group.date, 'EEEE, MMM d')}
          </h2>
          <TimeSpreadList tasks={group.tasks} activeTab={activeTab} onEdit={handleEdit} />
        </section>
      ))}
    </div>
  ) : (
    <div data-testid="timespread-list">
      <TimeSpreadList tasks={flat ?? []} activeTab={activeTab} onEdit={handleEdit} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('timeSpread.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('timeSpread.subtitle')}</p>
          </div>
          <TimeSpreadTabs active={activeTab} />
        </div>

        {/* Above the task list, and only on Today: the habit ritual is three
            taps and five seconds, so below a twenty-task list it is never seen.
            The other tabs are about future work, where a habit has nothing to
            say yet. */}
        {activeTab === ActiveTab.TODAY ? <HabitTodayStrip /> : null}

        {content}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editTask}
        projectId={editTask?.projectId ?? ''}
      />
    </div>
  );
};

export default TimeSpreadView;
