import { format, isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { HOUR_HEIGHT_PX, HOURS } from '../data';
import { allDayTasks, layoutDay, nowOffset } from '../geometry';
import type { BlockDragCommit } from '../useBlockDrag';
import { toDayKey } from '../utils';

import TaskBlock from './TaskBlock';

interface HourGridProps {
  days: Date[];
  tasksByDay: Map<string, ITask[]>;
  /** Injected so the now-line is deterministic in tests and stories. */
  now: Date;
  onSelect: (taskId: string) => void;
  /** Absent makes the grid read-only — blocks still open, nothing drags. */
  onDragCommit?: (taskId: string, commit: BlockDragCommit) => void;
}

const HourGrid = ({ days, tasksByDay, now, onSelect, onDragCommit }: HourGridProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  const hasAllDay = days.some(day => allDayTasks(tasksByDay.get(toDayKey(day)) ?? []).length > 0);

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
              <div className={cn('text-sm font-semibold', isToday(day) ? 'text-primary' : 'text-foreground')}>
                {format(day, 'd', { locale })}
              </div>
            </div>
          ))}
        </div>

        {/* All-day rail — untimed tasks never enter the hour grid */}
        {hasAllDay && (
          <div className="flex border-b border-border/60 bg-muted/20" data-testid="calendar-all-day">
            <div className="flex w-14 shrink-0 items-center justify-end pe-2 text-[11px] text-muted-foreground">
              {t('calendar.allDay')}
            </div>
            {days.map(day => {
              const key = toDayKey(day);
              return (
                <div key={key} className="flex-1 space-y-1 p-1" data-testid={`calendar-all-day-${key}`}>
                  {allDayTasks(tasksByDay.get(key) ?? []).map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelect(task.id)}
                      className="block w-full truncate rounded border border-border/60 bg-background px-2 py-1 text-start text-xs text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`calendar-allday-task-${task.id}`}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

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
            const offset = nowOffset(now, day);

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
