import { useTranslation } from 'react-i18next';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { cn } from '@/lib/utils';

import { calendarColor, chipStyle } from '../googleColor';
import { eventTime } from '../googleEventTime';
import type { EventChip, TaskSpan } from '../googleOverlay';
import { eventChips } from '../googleOverlay';

interface ChipLayerProps {
  events: IGoogleEvent[];
  dayKey: string;
  /** Resolves each event's colour. Empty until the picker query settles. */
  calendars: IGoogleCalendar[];
  /**
   * Minute spans of the day's task blocks. Read only to decide how much width
   * the events may take — the task layer lays itself out independently.
   */
  taskSpans?: TaskSpan[];
  onSelect: (event: IGoogleEvent) => void;
}

/**
 * Google events as readable chips behind the task layer.
 *
 * Replaces the anonymous tinted band: a band told the user an hour was busy but
 * not with what, which meant every meeting cost a click to identify. A chip
 * carries the title and start time inline, so the common case — "what is at
 * 11?" — is answered by looking.
 *
 * Chips size themselves the way task blocks do: full column when nothing
 * competes for the minutes, narrowing only where a task or another event does.
 * A fixed strip made every event look half-width on an empty day; full width
 * regardless of tasks hid the chip underneath the block.
 *
 * The layer participates in NO layout — it is absolutely positioned beneath the
 * task blocks — so an event arriving late can never move a task.
 */
const GoogleEventChips = ({ events, dayKey, calendars, taskSpans, onSelect }: ChipLayerProps) => {
  const chips = eventChips(events, dayKey, taskSpans);
  if (chips.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0" data-testid={`google-chips-${dayKey}`}>
      {chips.map(chip => (
        <Chip key={`${dayKey}-${chip.event.id}`} chip={chip} calendars={calendars} onSelect={onSelect} />
      ))}
    </div>
  );
};

interface ChipProps {
  chip: EventChip;
  calendars: IGoogleCalendar[];
  onSelect: (event: IGoogleEvent) => void;
}

const Chip = ({ chip, calendars, onSelect }: ChipProps) => {
  const { t } = useTranslation('task');
  const { event, top, height, column, columns, isCompact } = chip;

  const color = calendarColor(event.calendarId, calendars);
  // Same divisor a task block uses, so the two layers line up on the same grid.
  const width = 100 / columns;

  // A declined meeting still occupies the grid — Google returns it and the time
  // is genuinely blocked in the user's calendar — but it must not read as
  // something they are expected at.
  const isDeclined = event.responseStatus === 'declined';

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={t('calendar.googleEventLabel', { title: event.title, time: eventTime(event.start) })}
      className={cn(
        'absolute overflow-hidden rounded-md border border-s-[3px] px-1.5 py-0.5 text-start',
        'transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDeclined && 'opacity-55'
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        insetInlineStart: `${column * width}%`,
        width: `${width}%`,
        ...chipStyle(color),
      }}
      data-testid={`google-event-chip-${event.id}`}
      data-declined={isDeclined || undefined}
    >
      <span
        className={cn(
          'block truncate text-[11px] font-medium leading-tight text-foreground/80',
          isDeclined && 'line-through'
        )}
      >
        {event.title}
      </span>
      {/* A short meeting drops the time line rather than clipping it — the start
          is already implied by where the chip sits on the hour grid. */}
      {!isCompact && (
        <span className="block truncate text-[10px] leading-tight text-muted-foreground">{eventTime(event.start)}</span>
      )}
    </button>
  );
};

export default GoogleEventChips;
