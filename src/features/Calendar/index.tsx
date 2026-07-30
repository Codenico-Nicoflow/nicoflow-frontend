import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { TaskDialog } from '@/features/Tasks';
import { useIsMobile } from '@/hooks';
import { useGetCalendarTasksQuery } from '@/lib/store';
import type { ITask } from '@/lib/types';

import AgendaList from './components/AgendaList';
import { AgendaSkeleton, GridSkeleton, MonthSkeleton } from './components/CalendarSkeletons';
import CalendarToolbar from './components/CalendarToolbar';
import HourGrid from './components/HourGrid';
import MonthDensity from './components/MonthDensity';
import type { CalendarView } from './data';
import { groupByDayKey, parseDayParam, parseViewParam, rangeFor, shiftAnchor, toDayKey, visibleDays } from './utils';

interface CalendarViewProps {
  /** Injected clock — keeps the now-line deterministic in tests and stories. */
  now?: Date;
}

const CalendarPage = ({ now = new Date() }: CalendarViewProps) => {
  const { t } = useTranslation('task');
  const [searchParams, setSearchParams] = useSearchParams();
  // Width-based, matching the Rail's 768px breakpoint. Deliberately not
  // orientation-based: a landscape phone is ~650px wide and ~350px tall, which
  // is worse for an hour grid, not better.
  const isMobile = useIsMobile();

  // URL is the single source of truth for view+date, so a refreshed or shared
  // link restores the exact same grid.
  const view = parseViewParam(searchParams.get('view'));
  const anchor = parseDayParam(searchParams.get('date'), now);

  const [editTask, setEditTask] = useState<ITask | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const { data, isLoading } = useGetCalendarTasksQuery(range);

  const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
  // Below the breakpoint the hour grid is always a single column — week becomes
  // the agenda instead, so only `day` ever reaches the grid on mobile.
  const gridDays = isMobile ? days.slice(0, 1) : days;
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

  // Each view maps to the shape that survives the available width rather than
  // being squeezed into it: a 7-column grid at 375px is ~50px per day, too
  // narrow to read a title or hit a block.
  const isAgenda = isMobile && view === 'week';
  const isMonth = view === 'month';

  const skeleton = isMonth ? (
    <MonthSkeleton />
  ) : isAgenda ? (
    <AgendaSkeleton />
  ) : (
    <GridSkeleton columns={gridDays.length} />
  );

  const content = isMonth ? (
    <MonthDensity
      days={days}
      anchor={anchor}
      tasksByDay={tasksByDay}
      onDrillDown={day => commit({ view: 'day', date: day })}
    />
  ) : isAgenda ? (
    <AgendaList days={days} tasksByDay={tasksByDay} onSelect={handleSelect} />
  ) : (
    // Mobile day is the real hour grid at full width — the primary mobile view.
    <HourGrid days={gridDays} tasksByDay={tasksByDay} now={now} onSelect={handleSelect} />
  );

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

        {isLoading ? <div data-testid="calendar-loading">{skeleton}</div> : content}
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
