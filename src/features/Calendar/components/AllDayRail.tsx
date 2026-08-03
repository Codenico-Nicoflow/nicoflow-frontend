import { useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import type { ITask } from '@/lib/types';
import { TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { MAX_ALL_DAY_ROWS } from '../data';
import { allDayTasks } from '../geometry';
import { calendarColor, chipStyle } from '../googleColor';
import { allDayEventsOn } from '../googleWash';
import { toDayKey } from '../utils';

interface AllDayRailProps {
  days: Date[];
  tasksByDay: Map<string, ITask[]>;
  onSelect: (taskId: string) => void;
  /** All-day Google events join this rail, visually distinct (NIC-1863). */
  googleEvents?: IGoogleEvent[];
  /** Resolves each event's colour; empty until the picker query settles. */
  googleCalendars?: IGoogleCalendar[];
  onSelectGoogleEvent?: (event: IGoogleEvent) => void;
}

/**
 * Untimed tasks for the visible days, above the hour grid.
 *
 * These tasks belong to a DAY but not to an HOUR, so there is nowhere in the
 * grid to draw them — the rail is where a task lives when it has a date and no
 * time. It is capped rather than unbounded: one heavy day used to stretch the
 * whole row and leave every other day's items stranded at the top of a tall
 * band, which is what made the week read as "spread out and random".
 */
const AllDayRail = ({
  days,
  tasksByDay,
  onSelect,
  googleEvents = [],
  googleCalendars = [],
  onSelectGoogleEvent,
}: AllDayRailProps) => {
  const { t } = useTranslation('task');
  const [expanded, setExpanded] = useState(false);

  const byDay = days.map(day => {
    const key = toDayKey(day);
    return {
      day,
      key,
      tasks: allDayTasks(tasksByDay.get(key) ?? []),
      events: onSelectGoogleEvent ? allDayEventsOn(googleEvents, key) : [],
    };
  });
  // Google events share the rail's row budget, so a day full of holidays cannot
  // push the user's own tasks out of view — both are counted together.
  const deepest = byDay.reduce((max, entry) => Math.max(max, entry.tasks.length + entry.events.length), 0);
  if (deepest === 0) return null;

  // Every column shows the same number of rows, so items stay aligned across
  // days instead of each column setting its own height.
  const visibleRows = expanded ? deepest : Math.min(deepest, MAX_ALL_DAY_ROWS);
  const hiddenTotal = byDay.reduce(
    (sum, entry) => sum + Math.max(entry.tasks.length + entry.events.length - visibleRows, 0),
    0
  );

  return (
    <div className="flex border-b border-border/60 bg-muted/20" data-testid="calendar-all-day">
      <div className="flex w-14 shrink-0 flex-col items-end justify-start gap-1 pe-2 pt-1.5">
        <span className="text-[11px] leading-none text-muted-foreground">{t('calendar.allDay')}</span>
        {hiddenTotal > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded text-[10px] leading-none text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="calendar-all-day-expand"
          >
            {t('calendar.allDayMore', { count: hiddenTotal })}
          </button>
        )}
        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label={t('calendar.allDayCollapse')}
            className="rounded text-[10px] leading-none text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="calendar-all-day-collapse"
          >
            <ChevronDown className="h-3 w-3 rotate-180" aria-hidden />
          </button>
        )}
      </div>

      {byDay.map(({ key, tasks, events }) => (
        <div key={key} className="min-w-0 flex-1 space-y-1 p-1" data-testid={`calendar-all-day-${key}`}>
          {tasks.slice(0, visibleRows).map(task => {
            const isDone = task.status === TaskStatus.DONE;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelect(task.id)}
                className={cn(
                  'block w-full truncate rounded border px-2 py-1 text-start text-xs',
                  'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  // Completed work stays visible — the week should show what
                  // happened, not only what is left — but it must never compete
                  // with what is still open.
                  isDone
                    ? 'border-border/40 bg-background/50 text-muted-foreground line-through'
                    : 'border-border/60 bg-background text-foreground'
                )}
                data-testid={`calendar-allday-task-${task.id}`}
                data-done={isDone || undefined}
              >
                {task.title}
              </button>
            );
          })}

          {/* Google all-day events fill whatever rows the user's own tasks left
              — tasks always take the rail first. Carry their calendar's colour
              on the leading edge, and no checkbox affordance, so they never read
              as something the user can complete. */}
          {events.slice(0, Math.max(visibleRows - tasks.length, 0)).map(event => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectGoogleEvent?.(event)}
              className={cn(
                'block w-full truncate rounded-md border border-s-[3px] px-2 py-1 text-start text-xs',
                'text-foreground/80 transition-colors hover:brightness-105',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                event.responseStatus === 'declined' && 'line-through opacity-55'
              )}
              style={chipStyle(calendarColor(event.calendarId, googleCalendars))}
              data-testid={`calendar-allday-google-${event.id}`}
            >
              {event.title}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AllDayRail;
