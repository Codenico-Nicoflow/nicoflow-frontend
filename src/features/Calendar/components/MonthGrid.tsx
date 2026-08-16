import type { ITask } from '@nicoflow/shared/types';
import { format, isSameMonth } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { cn } from '@/lib/utils';

import { MAX_MONTH_CHIPS, MAX_MONTH_GOOGLE_CHIPS } from '../data';
import { googleEventsOn } from '../googleOverlay';
import { monthGridWeeks, toDayKey } from '../utils';

import MonthChip from './MonthChip';
import MonthGoogleChip from './MonthGoogleChip';

interface MonthGridProps {
  /** Full padded month grid — always 6 whole weeks, so rows stay rectangular. */
  days: Date[];
  anchor: Date;
  tasksByDay: Map<string, ITask[]>;
  /** Today in the account timezone, not the browser's. */
  todayKey: string;
  onDrillDown: (day: Date) => void;
  onSelect: (taskId: string) => void;
  /** Google overlay — empty when locked or not yet loaded, never awaited. */
  googleEvents?: IGoogleEvent[];
  googleCalendars?: IGoogleCalendar[];
  onSelectGoogleEvent?: (event: IGoogleEvent) => void;
}

/**
 * Desktop month view. Answers "which days are heavy?" first and "what exactly?"
 * second, so a cell shows a few real chips and collapses the rest into a count
 * rather than scrolling — a scrolling cell would break the at-a-glance read the
 * month exists for. The overflow affordance drills into the day, which is where
 * the full list already lives.
 */
const MonthGrid = ({
  days,
  anchor,
  tasksByDay,
  todayKey,
  onDrillDown,
  onSelect,
  googleEvents = [],
  googleCalendars = [],
  onSelectGoogleEvent,
}: MonthGridProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  const weeks = monthGridWeeks(days);
  // Weekday headers come from the first rendered week, so they follow the
  // locale's week start rather than a hardcoded Mon–Sun list.
  const weekdays = weeks[0] ?? [];
  const isEmpty = days.every(day => (tasksByDay.get(toDayKey(day)) ?? []).length === 0);

  return (
    <div data-testid="calendar-month-grid">
      <div className="grid grid-cols-7 border-b border-border/60">
        {weekdays.map(day => (
          <div key={`head-${toDayKey(day)}`} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {format(day, 'EEE', { locale })}
          </div>
        ))}
      </div>

      {/* The grid always renders — a month with nothing in it is still a month,
          and collapsing it would make an empty month jump the layout. The empty
          state sits above it so the view reads as empty rather than broken. */}
      {isEmpty && (
        <EmptyState
          icon={CalendarDays}
          title={t('calendar.emptyTitle')}
          description={t('calendar.monthEmptyDescription')}
          data-testid="calendar-month-empty"
        />
      )}

      <div className="grid grid-cols-7 border-s border-t border-border/40">
        {days.map(day => {
          const key = toDayKey(day);
          const tasks = tasksByDay.get(key) ?? [];
          const visible = tasks.slice(0, MAX_MONTH_CHIPS);
          const overflow = tasks.length - visible.length;
          const googleDay = googleEventsOn(googleEvents, key);
          const visibleGoogle = googleDay.slice(0, MAX_MONTH_GOOGLE_CHIPS);
          const googleOverflow = googleDay.length - visibleGoogle.length;
          const outside = !isSameMonth(day, anchor);
          const isToday = key === todayKey;

          return (
            // The cell is a container, not a control: it holds chips, which are
            // themselves buttons, and a button inside a button is unreachable
            // for a screen reader. The day number carries the drill-through, and
            // a click on the cell's empty space forwards to it — pointer users
            // keep the whole-cell target without the invalid nesting.
            <div
              key={key}
              onClick={() => onDrillDown(day)}
              className={cn(
                'flex min-h-28 cursor-pointer flex-col gap-1 border-b border-e border-border/40 p-1.5',
                'hover:bg-accent/50',
                outside && 'bg-muted/30'
              )}
              data-testid={`calendar-month-cell-${key}`}
              data-outside={outside || undefined}
              data-today={isToday || undefined}
            >
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  onDrillDown(day);
                }}
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isToday && 'bg-primary font-semibold text-primary-foreground',
                  !isToday && outside && 'text-muted-foreground/60',
                  !isToday && !outside && 'text-foreground hover:bg-accent'
                )}
                data-testid={`calendar-month-open-${key}`}
                aria-label={t('calendar.monthCellLabel', {
                  date: format(day, 'PPP', { locale }),
                  count: tasks.length,
                })}
                aria-current={isToday ? 'date' : undefined}
              >
                {format(day, 'd', { locale })}
              </button>

              <div className="flex min-w-0 flex-col gap-0.5">
                {visible.map(task => (
                  <MonthChip key={task.id} task={task} onSelect={onSelect} />
                ))}

                {overflow > 0 && (
                  <span
                    className="px-1 text-[11px] font-medium text-muted-foreground"
                    data-testid={`calendar-month-overflow-${key}`}
                  >
                    {t('calendar.moreCount', { count: overflow })}
                  </span>
                )}

                {onSelectGoogleEvent &&
                  visibleGoogle.map(event => (
                    <MonthGoogleChip
                      key={event.id}
                      event={event}
                      calendars={googleCalendars}
                      onSelect={onSelectGoogleEvent}
                    />
                  ))}

                {onSelectGoogleEvent && googleOverflow > 0 && (
                  <span
                    className="px-1 text-[11px] font-medium text-muted-foreground"
                    data-testid={`calendar-month-google-overflow-${key}`}
                  >
                    {t('calendar.moreCount', { count: googleOverflow })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;
