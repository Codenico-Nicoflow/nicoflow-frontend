import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { DEFAULT_BLOCK_MINUTES, HOUR_HEIGHT_PX, MINUTES_PER_DAY } from '../data';
import type { CalendarPrefs } from '../displayPrefs';
import { DEFAULT_CALENDAR_PREFS, hourHeightFor, hoursIn, visibleHourRange } from '../displayPrefs';
import { layoutDay, nowOffset, parseMinutes } from '../geometry';
import type { TaskSpan } from '../googleOverlay';
import { eventChips, eventCountOn, hasConflict } from '../googleOverlay';
import type { BlockDragCommit } from '../useBlockDrag';
import { toDayKey } from '../utils';

import AllDayRail from './AllDayRail';
import GoogleEventChips from './GoogleEventChip';
import TaskBlock from './TaskBlock';

interface HourGridProps {
  days: Date[];
  tasksByDay: Map<string, ITask[]>;
  /** Injected so the now-line is deterministic in tests and stories. */
  now: Date;
  /** Today in the account zone — the same key the month views highlight. */
  todayKey: string;
  /** Account zone, so the now-line sits at the account's wall clock. */
  timezone?: string;
  onSelect: (taskId: string) => void;
  /** Absent makes the grid read-only — blocks still open, nothing drags. */
  onDragCommit?: (taskId: string, commit: BlockDragCommit) => void;
  /**
   * Google events for the visible range (NIC-1863). Optional and defaulted, so
   * a grid rendered without the overlay is byte-identical to before.
   */
  googleEvents?: IGoogleEvent[];
  /** Resolves each event's colour; empty until the picker query settles. */
  googleCalendars?: IGoogleCalendar[];
  onSelectGoogleEvent?: (event: IGoogleEvent) => void;
  /** Which hours to draw (NIC-1890). Defaults to the full day. */
  prefs?: CalendarPrefs;
}

const HourGrid = ({
  days,
  tasksByDay,
  now,
  todayKey,
  timezone,
  onSelect,
  onDragCommit,
  googleEvents = [],
  googleCalendars = [],
  onSelectGoogleEvent,
  prefs = DEFAULT_CALENDAR_PREFS,
}: HourGridProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  // Everything drawn across every visible day, so the window widens once for
  // the whole grid rather than per column — columns of different heights would
  // not line up against a shared hour gutter.
  const occupied = days.flatMap(day => occupiedSpans(tasksByDay.get(toDayKey(day)) ?? [], googleEvents, toDayKey(day)));
  const window = visibleHourRange(prefs, occupied);
  const hours = hoursIn(window);
  // Narrowing the day frees vertical space; spending it on taller rows is what
  // makes 15- and 30-minute blocks distinguishable. Every px↔minute conversion
  // below — geometry, chips and drag alike — takes THIS value, never the base
  // constant, or the grid and the gestures would disagree about what a pixel is.
  const hourHeight = hourHeightFor(window, HOUR_HEIGHT_PX);
  // Everything is positioned from midnight, so drawing a window means shifting
  // the whole layer up by the hours that are no longer rendered.
  const offsetPx = window[0] * hourHeight;

  return (
    // The grid scrolls inside its own box, never the page body: a horizontally
    // scrolling body would make every future drag gesture (NIC-1808) ambiguous.
    // Below md the caller passes a single day, so the min-width never engages.
    <div className="overflow-x-auto" data-testid="calendar-grid">
      <div className="md:min-w-[600px]">
        {/* Day headers */}
        <div className="flex border-b border-border/60">
          <div className="w-14 shrink-0" aria-hidden />
          {days.map(day => (
            <div
              key={toDayKey(day)}
              className="flex-1 px-2 py-2 text-center"
              data-testid={`calendar-header-${toDayKey(day)}`}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {format(day, 'EEE', { locale })}
              </div>
              <div
                className={cn('text-sm font-semibold', toDayKey(day) === todayKey ? 'text-primary' : 'text-foreground')}
              >
                {format(day, 'd', { locale })}
              </div>
              {eventCountOn(googleEvents, toDayKey(day)) > 0 && (
                <div
                  className="text-[10px] leading-none text-muted-foreground"
                  data-testid={`calendar-google-count-${toDayKey(day)}`}
                >
                  {t('calendar.googleEventCount', { count: eventCountOn(googleEvents, toDayKey(day)) })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Untimed tasks have a date but no hour, so they live here rather than
            being forced onto a row that would claim a time they don't have. */}
        <AllDayRail
          days={days}
          tasksByDay={tasksByDay}
          onSelect={onSelect}
          googleEvents={googleEvents}
          googleCalendars={googleCalendars}
          onSelectGoogleEvent={onSelectGoogleEvent}
        />

        {/* Hour rows + positioned blocks */}
        <div className="flex">
          <div className="w-14 shrink-0" data-testid="calendar-gutter">
            {hours.map(hour => (
              <div
                key={hour}
                style={{ height: `${hourHeight}px` }}
                className="relative pe-2 text-end text-[11px] text-muted-foreground"
              >
                <span className="absolute end-2 -top-1.5">
                  {hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
                </span>
              </div>
            ))}
          </div>

          {days.map(day => {
            const key = toDayKey(day);
            const dayTasks = tasksByDay.get(key) ?? [];
            const offset = nowOffset(now, day, timezone, hourHeight);
            const layouts = layoutDay(dayTasks, hourHeight);
            // The drawn extent of each block, computed once: the conflict accent
            // and the event chips' width both key off it, and deriving it twice
            // would let the two drift apart.
            const spans = layouts.map(({ task }): TaskSpan => {
              const start = parseMinutes(task.scheduledTime) ?? 0;
              return [start, Math.min(start + (task.estimatedMinutes ?? DEFAULT_BLOCK_MINUTES), MINUTES_PER_DAY)];
            });

            return (
              <div
                key={key}
                className="relative flex-1 overflow-hidden border-s border-border/60"
                data-testid={`calendar-day-${key}`}
              >
                {hours.map(hour => (
                  <div key={hour} style={{ height: `${hourHeight}px` }} className="border-b border-border/40" />
                ))}

                {/* One shifted layer for everything positioned from midnight.
                    Translating the container rather than each child keeps every
                    block, chip and drag calculation measured from 00:00 — the
                    same origin the stored `scheduledTime` uses — so a narrowed
                    window changes what is VISIBLE and never what a value means. */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0"
                  // A full day tall regardless of the window: children are
                  // positioned from midnight and would have nothing to sit in
                  // otherwise. The day column clips whatever falls outside.
                  style={{
                    height: `${(MINUTES_PER_DAY / 60) * hourHeight}px`,
                    transform: `translateY(-${offsetPx}px)`,
                  }}
                  data-testid={`calendar-day-layer-${key}`}
                >
                  {/* Behind the blocks, and absolutely positioned, so events can
                      never move a task — they only narrow themselves around one. */}
                  {onSelectGoogleEvent && (
                    <div className="pointer-events-auto absolute inset-0">
                      <GoogleEventChips
                        events={googleEvents}
                        dayKey={key}
                        calendars={googleCalendars}
                        taskSpans={spans}
                        hourHeight={hourHeight}
                        onSelect={onSelectGoogleEvent}
                      />
                    </div>
                  )}

                  <div className="pointer-events-auto absolute inset-0">
                    {layouts.map((layout, index) => (
                      <TaskBlock
                        key={layout.task.id}
                        layout={layout}
                        onSelect={onSelect}
                        onDragCommit={onDragCommit}
                        hourHeight={hourHeight}
                        hasConflict={hasConflict(googleEvents, key, spans[index]![0], spans[index]![1])}
                      />
                    ))}
                  </div>

                  {offset !== null && (
                    <div
                      className="pointer-events-none absolute inset-x-0 border-t-2 border-destructive"
                      style={{ top: `${offset}px` }}
                      data-testid="calendar-now-line"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Minute bounds of everything drawn on one day — tasks AND Google events.
 *
 * Feeds the auto-expand: the chosen hour window is a default view, never a
 * filter, so anything scheduled outside it widens the grid rather than
 * vanishing. Events count for the same reason tasks do — a meeting the user
 * does not control disappearing is exactly as bad.
 */
const occupiedSpans = (tasks: ITask[], events: IGoogleEvent[], dayKey: string): [number, number][] => {
  const spans = tasks
    .map((task): [number, number] | null => {
      const start = parseMinutes(task.scheduledTime);
      if (start === null) return null;
      return [start, Math.min(start + (task.estimatedMinutes ?? DEFAULT_BLOCK_MINUTES), MINUTES_PER_DAY)];
    })
    .filter((span): span is [number, number] => span !== null);

  eventChips(events, dayKey).forEach(chip => {
    const start = (chip.top / HOUR_HEIGHT_PX) * 60;
    spans.push([start, start + (chip.height / HOUR_HEIGHT_PX) * 60]);
  });

  return spans;
};

export default HourGrid;
