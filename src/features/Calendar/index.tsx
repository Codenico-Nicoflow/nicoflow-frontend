import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { PlanLimitAlert } from '@/components';
import { TaskDialog } from '@/features/Tasks';
import { useIsMobile, useIsPro } from '@/hooks';
import type { IGoogleEvent } from '@/lib/store';
import {
  useAppUser,
  useGetCalendarTasksQuery,
  useGetGoogleCalendarsQuery,
  useGetGoogleEventsQuery,
  useScheduleTaskMutation,
  useUpdateTaskMutation,
} from '@/lib/store';
import type { ITask } from '@/lib/types';
import { getApiErrorCode, resolveTimeZone, showErrorToast } from '@/lib/utils';

import AgendaList from './components/AgendaList';
import { AgendaSkeleton, GridSkeleton, MonthSkeleton } from './components/CalendarSkeletons';
import CalendarTeaser from './components/CalendarTeaser';
import CalendarToolbar from './components/CalendarToolbar';
import GoogleEventPopover from './components/GoogleEventPopover';
import GoogleStatusStrip from './components/GoogleStatusStrip';
import HourGrid from './components/HourGrid';
import MonthDensity from './components/MonthDensity';
import MonthGrid from './components/MonthGrid';
import TimezoneDriftBanner from './components/TimezoneDriftBanner';
import type { CalendarView } from './data';
import { toTimeString } from './dragMath';
import { clearDismissedStatus, dismissStatus, isStatusDismissed } from './googleStatusDismissal';
import { isDriftDismissed } from './timezoneDismissal';
import { detectTimezoneDrift } from './timezoneDrift';
import type { BlockDragCommit } from './useBlockDrag';
import {
  groupByDayKey,
  parseDayParam,
  parseViewParam,
  rangeFor,
  shiftAnchor,
  toDayKey,
  todayKeyIn,
  visibleDays,
} from './utils';

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
  const user = useAppUser();
  // Timed scheduling is Pro. The gate is UI-only — the backend refuses the write
  // regardless — so this decides what to *render*, never what is allowed.
  const isLocked = !useIsPro();

  // URL is the single source of truth for view+date, so a refreshed or shared
  // link restores the exact same grid.
  const view = parseViewParam(searchParams.get('view'));
  const anchor = parseDayParam(searchParams.get('date'), now);

  // Every scheduledFor and every server sweep is keyed to the account zone, so
  // "today" has to be too — a traveller must still see their account's day.
  const todayKey = todayKeyIn(user?.timezone, now);

  const [editTask, setEditTask] = useState<ITask | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [planLimitHit, setPlanLimitHit] = useState(false);
  // Resolving the banner is a within-session decision; the durable record lives
  // in localStorage so it also survives a reload.
  const [isDriftResolved, setIsDriftResolved] = useState(false);

  // The account zone is authoritative and is never overwritten automatically —
  // this only decides whether to *ask*. Compared by current UTC offset, so two
  // names for the same wall clock (Berlin vs Paris) never nag.
  const drift = useMemo(() => detectTimezoneDrift(user?.timezone, resolveTimeZone(), now), [user?.timezone, now]);
  const showDrift = drift !== null && !isDriftResolved && !isDriftDismissed(drift.accountZone, drift.browserZone);

  const [scheduleTask] = useScheduleTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  // Locked users always get the month window regardless of the view param: the
  // teaser is a month, and honouring ?view=day would fetch a range its chrome
  // never draws.
  const effectiveView = isLocked ? 'month' : view;
  const range = useMemo(() => rangeFor(effectiveView, anchor), [effectiveView, anchor]);
  const { data, isLoading } = useGetCalendarTasksQuery(range);

  // The Google layer loads INDEPENDENTLY of the task layer and is never awaited
  // alongside it: a slow or failing Google call must not delay the user's own
  // work appearing. Skipped entirely while the calendar is plan-locked, since
  // the teaser renders no grid to wash.
  const { data: googleData } = useGetGoogleEventsQuery(
    { from: range.scheduledFrom, to: range.scheduledTo },
    { skip: isLocked }
  );
  // Only for resolving a calendar's display name in the popover, so a failure
  // here degrades to showing the ID rather than blocking anything.
  const { data: googleCalendars } = useGetGoogleCalendarsQuery(undefined, { skip: isLocked });
  const googleEvents = googleData?.events ?? [];

  const [selectedEvent, setSelectedEvent] = useState<IGoogleEvent | null>(null);

  // Within-session dismissal; the durable record lives in localStorage so it
  // also survives a reload.
  const [isGoogleStatusResolved, setIsGoogleStatusResolved] = useState(false);
  const googleStatus = googleData?.googleStatus ?? 'ok';
  // A healthy fetch clears the stored dismissal, so the NEXT genuine failure is
  // not pre-silenced by an answer to an older, unrelated one.
  if (googleStatus === 'ok') clearDismissedStatus();
  const showGoogleStatus =
    !isLocked && googleStatus !== 'ok' && !isGoogleStatusResolved && !isStatusDismissed(googleStatus);

  const days = useMemo(() => visibleDays(effectiveView, anchor), [effectiveView, anchor]);
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

  /**
   * Persist a finished drag.
   *
   * A move writes only the time; a resize writes only `estimatedMinutes`. They
   * stay on separate endpoints so moving a block can never invent a duration
   * for a task the user never estimated.
   */
  const handleDragCommit = async (taskId: string, commit: BlockDragCommit) => {
    const task = (data ?? []).find(candidate => candidate.id === taskId);
    if (!task?.scheduledFor) return;

    try {
      if (commit.mode === 'move') {
        await scheduleTask({
          id: taskId,
          scheduledFor: task.scheduledFor,
          scheduledTime: toTimeString(commit.startMinutes),
        }).unwrap();
      } else {
        await updateTask({ id: taskId, estimatedMinutes: commit.minutes }).unwrap();
      }
    } catch (error) {
      // The optimistic patch has already rolled back by here, so the block is
      // visibly back where it started; this only explains why.
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        setPlanLimitHit(true);
        return;
      }
      showErrorToast(error, toast);
    }
  };

  // Each view maps to the shape that survives the available width rather than
  // being squeezed into it: a 7-column grid at 375px is ~50px per day, too
  // narrow to read a title or hit a block.
  const isAgenda = isMobile && effectiveView === 'week';
  const isMonth = effectiveView === 'month';

  // Locked always resolves to the month teaser, so its skeleton is the month one.
  const skeleton = isMonth ? (
    <MonthSkeleton />
  ) : isAgenda ? (
    <AgendaSkeleton />
  ) : (
    <GridSkeleton columns={gridDays.length} />
  );

  // Desktop has the width for real chips; a ~50px phone cell only ever fits
  // density dots, so the two month shapes stay separate components.
  const content = isLocked ? (
    <CalendarTeaser days={days} anchor={anchor} tasksByDay={tasksByDay} todayKey={todayKey} isMobile={isMobile} />
  ) : isMonth ? (
    isMobile ? (
      <MonthDensity
        days={days}
        anchor={anchor}
        tasksByDay={tasksByDay}
        todayKey={todayKey}
        onDrillDown={day => commit({ view: 'day', date: day })}
      />
    ) : (
      <MonthGrid
        days={days}
        anchor={anchor}
        tasksByDay={tasksByDay}
        todayKey={todayKey}
        onDrillDown={day => commit({ view: 'day', date: day })}
        onSelect={handleSelect}
      />
    )
  ) : isAgenda ? (
    <AgendaList days={days} tasksByDay={tasksByDay} onSelect={handleSelect} />
  ) : (
    // Mobile day is the real hour grid at full width — the primary mobile view.
    <HourGrid
      days={gridDays}
      tasksByDay={tasksByDay}
      now={now}
      todayKey={todayKey}
      timezone={user?.timezone}
      onSelect={handleSelect}
      onDragCommit={handleDragCommit}
      googleEvents={googleEvents}
      googleCalendars={googleCalendars ?? []}
      onSelectGoogleEvent={setSelectedEvent}
    />
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('calendar.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>

        {/* Above the toolbar because it qualifies every time drawn below it —
            a user must know the grid is in their account zone before reading it. */}
        {showDrift && drift && (
          <TimezoneDriftBanner drift={drift} now={now} onResolved={() => setIsDriftResolved(true)} />
        )}

        <CalendarToolbar
          view={effectiveView}
          anchor={anchor}
          onViewChange={next => commit({ view: next })}
          onShift={direction => commit({ date: shiftAnchor(effectiveView, anchor, direction) })}
          onToday={() => commit({ date: now })}
          hideViewSwitcher={isLocked}
        />

        {/* Google is a secondary layer: this says so in place, while every task
            below still renders normally. */}
        {showGoogleStatus && (
          <GoogleStatusStrip
            status={googleStatus}
            onDismiss={() => {
              dismissStatus(googleStatus);
              setIsGoogleStatusResolved(true);
            }}
          />
        )}

        {/* A free user's drag is refused by the server, so the upgrade path is
            explained in place rather than as a toast that scrolls away. */}
        {planLimitHit && <PlanLimitAlert message={t('calendar.timedSchedulingLocked')} />}

        {isLoading ? <div data-testid="calendar-loading">{skeleton}</div> : content}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editTask}
        projectId={editTask?.projectId ?? ''}
      />

      {/* Read-only: Nicoflow holds calendar.readonly and writes nothing back,
          so the only action offered is a link out to Google. */}
      <GoogleEventPopover
        event={selectedEvent}
        calendars={googleCalendars ?? []}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};

export default CalendarPage;
