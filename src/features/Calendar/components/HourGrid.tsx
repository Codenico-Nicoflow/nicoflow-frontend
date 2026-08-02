import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { HOUR_HEIGHT_PX, HOURS } from '../data';
import { layoutDay, nowOffset } from '../geometry';
import type { BlockDragCommit } from '../useBlockDrag';
import { toDayKey } from '../utils';

import AllDayRail from './AllDayRail';
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
}

const HourGrid = ({ days, tasksByDay, now, todayKey, timezone, onSelect, onDragCommit }: HourGridProps) => {
  const { i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

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
            </div>
          ))}
        </div>

        {/* Untimed tasks have a date but no hour, so they live here rather than
            being forced onto a row that would claim a time they don't have. */}
        <AllDayRail days={days} tasksByDay={tasksByDay} onSelect={onSelect} />

        {/* Hour rows + positioned blocks */}
        <div className="flex">
          <div className="w-14 shrink-0" data-testid="calendar-gutter">
            {HOURS.map(hour => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT_PX}px` }}
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
            const offset = nowOffset(now, day, timezone);

            return (
              <div key={key} className="relative flex-1 border-s border-border/60" data-testid={`calendar-day-${key}`}>
                {HOURS.map(hour => (
                  <div key={hour} style={{ height: `${HOUR_HEIGHT_PX}px` }} className="border-b border-border/40" />
                ))}

                {layoutDay(dayTasks).map(layout => (
                  <TaskBlock key={layout.task.id} layout={layout} onSelect={onSelect} onDragCommit={onDragCommit} />
                ))}

                {offset !== null && (
                  <div
                    className="pointer-events-none absolute inset-x-0 border-t-2 border-destructive"
                    style={{ top: `${offset}px` }}
                    data-testid="calendar-now-line"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HourGrid;
