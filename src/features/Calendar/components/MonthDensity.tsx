import { format, isSameMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { MAX_DENSITY_DOTS } from '../data';
import { toDayKey } from '../utils';

interface MonthDensityProps {
  /** Full padded month grid — always whole weeks, so rows stay rectangular. */
  days: Date[];
  anchor: Date;
  tasksByDay: Map<string, ITask[]>;
  /** Today in the account timezone, not the browser's. */
  todayKey: string;
  onDrillDown: (day: Date) => void;
}

/**
 * Mobile month view. At 375px a cell is ~50px wide, which fits a number and a
 * few dots but never a task title — so the month answers "which days are
 * heavy?" and delegates "what exactly?" to a tap that drills into the day view.
 */
const MonthDensity = ({ days, anchor, tasksByDay, todayKey, onDrillDown }: MonthDensityProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  // Weekday headers come from the first rendered week, so they follow the
  // locale's week start rather than a hardcoded Mon–Sun list.
  const weekdays = days.slice(0, 7);

  return (
    <div data-testid="calendar-month">
      <div className="grid grid-cols-7 border-b border-border/60">
        {weekdays.map(day => (
          <div key={`head-${toDayKey(day)}`} className="py-2 text-center text-xs text-muted-foreground">
            {format(day, 'EEEEE', { locale })}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map(day => {
          const key = toDayKey(day);
          const count = (tasksByDay.get(key) ?? []).length;
          const outside = !isSameMonth(day, anchor);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDrillDown(day)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 border-b border-e border-border/40 p-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                outside && 'text-muted-foreground/50',
                !outside && 'text-foreground',
                'hover:bg-accent'
              )}
              data-testid={`calendar-month-cell-${key}`}
              data-today={key === todayKey || undefined}
              aria-label={t('calendar.monthCellLabel', {
                date: format(day, 'PPP', { locale }),
                count,
              })}
            >
              <span className={cn('text-sm', key === todayKey && 'font-bold text-primary')}>
                {format(day, 'd', { locale })}
              </span>

              {count > 0 && (
                <span className="flex items-center gap-0.5" data-testid={`calendar-month-density-${key}`}>
                  {/* Dots cap out so a 20-task day doesn't overflow the cell;
                      the count carries the exact number. */}
                  {Array.from({ length: Math.min(count, MAX_DENSITY_DOTS) }, (_, dot) => (
                    <span key={dot} className="size-1 rounded-full bg-primary" />
                  ))}
                  {count > MAX_DENSITY_DOTS && <span className="text-[10px] text-muted-foreground">+</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthDensity;
