import { format, isToday } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { getDateLocale } from '@/lib/i18n/dateLocale';
import type { ITask } from '@/lib/types';
import { cn } from '@/lib/utils';

import { toDayKey } from '../utils';

interface AgendaListProps {
  days: Date[];
  tasksByDay: Map<string, ITask[]>;
  onSelect: (taskId: string) => void;
}

/**
 * Mobile week view. A 7-column hour grid at 375px gives each day ~50px, too
 * narrow to read a title or hit a block, so the week becomes a vertical agenda
 * instead of a squeezed grid.
 *
 * Empty days are collapsed rather than rendered as blank rows — on a phone the
 * scroll cost of six empty days outweighs the calendar-shaped reassurance.
 */
const AgendaList = ({ days, tasksByDay, onSelect }: AgendaListProps) => {
  const { t, i18n } = useTranslation('task');
  const locale = getDateLocale(i18n.language);

  const populated = days.filter(day => (tasksByDay.get(toDayKey(day)) ?? []).length > 0);

  if (populated.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t('calendar.emptyTitle')}
        description={t('calendar.emptyDescription')}
        data-testid="calendar-agenda-empty"
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-agenda">
      {populated.map(day => {
        const key = toDayKey(day);
        return (
          <section key={key} className="space-y-2" data-testid={`calendar-agenda-day-${key}`}>
            <h2
              className={cn(
                'text-sm font-semibold uppercase tracking-wide',
                isToday(day) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {format(day, 'EEEE, MMM d', { locale })}
            </h2>
            <ul className="space-y-2">
              {(tasksByDay.get(key) ?? []).map(task => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(task.id)}
                    className="flex w-full items-baseline gap-3 rounded-md border border-border/60 bg-background px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid={`calendar-agenda-task-${task.id}`}
                  >
                    {/* Fixed-width time column keeps titles aligned; all-day rows
                        read as "All day" rather than an empty gutter. */}
                    <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {task.scheduledTime ?? t('calendar.allDay')}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default AgendaList;
