import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { TaskDialog, TasksLoadingState } from '@/features/Tasks';
import { useGetCalendarTasksQuery } from '@/lib/store';
import type { ITask } from '@/lib/types';

import CalendarToolbar from './components/CalendarToolbar';
import HourGrid from './components/HourGrid';
import type { CalendarView } from './data';
import { groupByDayKey, parseDayParam, parseViewParam, rangeFor, shiftAnchor, toDayKey, visibleDays } from './utils';

interface CalendarViewProps {
  /** Injected clock — keeps the now-line deterministic in tests and stories. */
  now?: Date;
}

const CalendarPage = ({ now = new Date() }: CalendarViewProps) => {
  const { t } = useTranslation('task');
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the single source of truth for view+date, so a refreshed or shared
  // link restores the exact same grid.
  const view = parseViewParam(searchParams.get('view'));
  const anchor = parseDayParam(searchParams.get('date'), now);

  const [editTask, setEditTask] = useState<ITask | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const { data, isLoading } = useGetCalendarTasksQuery(range);

  const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
  const tasksByDay = useMemo(() => groupByDayKey(data ?? []), [data]);

  const commit = (next: { view?: CalendarView; date?: Date }) => {
    setSearchParams(
      {
        view: next.view ?? view,
        date: toDayKey(next.date ?? anchor),
      },
      { replace: true }
    );
  };

  const handleSelect = (taskId: string) => {
    const task = (data ?? []).find(candidate => candidate.id === taskId);
    if (!task) return;
    // Reuse the existing dialog — the calendar deliberately has no editor of its own.
    setEditTask(task);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('calendar.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>

        <CalendarToolbar
          view={view}
          anchor={anchor}
          onViewChange={next => commit({ view: next })}
          onShift={direction => commit({ date: shiftAnchor(view, anchor, direction) })}
          onToday={() => commit({ date: now })}
        />

        {isLoading ? (
          <div data-testid="calendar-loading">
            <TasksLoadingState />
          </div>
        ) : (
          <HourGrid days={days} tasksByDay={tasksByDay} now={now} onSelect={handleSelect} />
        )}
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

export default CalendarPage;
