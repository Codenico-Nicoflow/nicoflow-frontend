import { useTranslation } from 'react-i18next';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { cn } from '@/lib/utils';

import { calendarColor } from '../googleColor';
import { eventTime } from '../googleEventTime';

interface MonthGoogleChipProps {
  event: IGoogleEvent;
  calendars: IGoogleCalendar[];
  onSelect: (event: IGoogleEvent) => void;
}

/**
 * One Google event inside a desktop month cell — the flat-list counterpart to
 * `MonthChip`. No hour axis exists at month granularity, so it carries a start
 * time (when timed) and a truncated title rather than the hour-grid's geometry.
 */
const MonthGoogleChip = ({ event, calendars, onSelect }: MonthGoogleChipProps) => {
  const { t } = useTranslation('task');
  const color = calendarColor(event.calendarId, calendars);
  const isDeclined = event.responseStatus === 'declined';

  return (
    <button
      type="button"
      // Stops the click from also firing the parent cell's drill-through.
      onClick={event_ => {
        event_.stopPropagation();
        onSelect(event);
      }}
      className={cn(
        'flex w-full items-baseline gap-1 rounded border-s-2 px-1 py-0.5 text-start text-[11px] leading-tight',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        isDeclined && 'opacity-55'
      )}
      style={{ borderInlineStartColor: color }}
      data-testid={`calendar-month-google-chip-${event.id}`}
      aria-label={t('calendar.googleEventLabel', { title: event.title, time: eventTime(event.start) })}
    >
      {!event.allDay && <span className="shrink-0 tabular-nums text-muted-foreground">{eventTime(event.start)}</span>}
      <span className={cn('min-w-0 flex-1 truncate text-muted-foreground', isDeclined && 'line-through')}>
        {event.title}
      </span>
    </button>
  );
};

export default MonthGoogleChip;
