import { useMemo, useState } from 'react';

import type { ITask } from '@nicoflow/shared/types';
import { ActiveTab } from '@nicoflow/shared/types';
import { format } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';
import { HabitTodayStrip } from '@/features/Habits';
import { TaskDialog, TasksLoadingState } from '@/features/Tasks';
import { useGetTimeSpreadQuery } from '@/lib/store';

import TimeSpreadCombinedView from './components/TimeSpreadCombinedView';
import TimeSpreadList from './components/TimeSpreadList';
import TimeSpreadTabs from './components/TimeSpreadTabs';
import ViewModeToggle, { type ViewMode } from './components/ViewModeToggle';
import { activeTabToScheduledFor, groupByDay } from './utils';

const VIEW_MODE_STORAGE_KEY = 'nicoflow-timespread-view';

const readStoredViewMode = (): ViewMode => {
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === 'combined' ? 'combined' : 'tabs';
};

interface TimeSpreadViewProps {
  activeTab: (typeof ActiveTab)[keyof typeof ActiveTab];
}

const TimeSpreadView = ({ activeTab }: TimeSpreadViewProps) => {
  const { t } = useTranslation('task');
  const { data, isLoading } = useGetTimeSpreadQuery();

  const [editTask, setEditTask] = useState<ITask | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const handleEdit = (task: ITask) => {
    setEditTask(task);
    setIsDialogOpen(true);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const flat =
    activeTab === ActiveTab.TODAY ? data?.today : activeTab === ActiveTab.TOMORROW ? data?.tomorrow : undefined;
  const weekGroups = useMemo(() => groupByDay(data?.thisWeek ?? []), [data?.thisWeek]);

  const isEmpty = activeTab === ActiveTab.WEEK ? weekGroups.length === 0 : (flat?.length ?? 0) === 0;

  const tabContent = isLoading ? (
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

  const content = isLoading ? (
    <div data-testid="timespread-loading">
      <TasksLoadingState />
    </div>
  ) : viewMode === 'combined' ? (
    <TimeSpreadCombinedView
      today={data?.today ?? []}
      tomorrow={data?.tomorrow ?? []}
      weekGroups={weekGroups}
      onEdit={handleEdit}
    />
  ) : (
    tabContent
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('timeSpread.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('timeSpread.subtitle')}</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              data-testid="timespread-create-task"
              aria-label={t('timeSpread.createFabLabel')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('timeSpread.createFabLabel')}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            {viewMode === 'tabs' ? <TimeSpreadTabs active={activeTab} /> : <div />}
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          </div>
        </div>

        {/* Above the task list, and only on Today: the habit ritual is three
            taps and five seconds, so below a twenty-task list it is never seen.
            The other tabs are about future work, where a habit has nothing to
            say yet. */}
        {activeTab === ActiveTab.TODAY && viewMode === 'tabs' ? <HabitTodayStrip /> : null}

        {content}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editTask}
        projectId={editTask?.projectId ?? ''}
      />
      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialScheduledFor={activeTabToScheduledFor(activeTab)}
      />
    </div>
  );
};

export default TimeSpreadView;
