import { useTranslation } from 'react-i18next';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { cn } from '@/lib/utils';

import { calendarColor, chipStyle } from '../googleColor';
import { eventTime } from '../googleEventTime';
import type { EventChip } from '../googleWash';
import { eventChips } from '../googleWash';

interface ChipLayerProps {
  events: IGoogleEvent[];
  dayKey: string;
  /** Resolves each event's colour. Empty until the picker query settles. */
  calendars: IGoogleCalendar[];
  onSelect: (event: IGoogleEvent) => void;
}

/**
 * How much of the day column the overlay strip occupies (NIC-1881).
 *
 * The chips are inset instead of full-width so a task block always has visible
 * column to its right — the user's own work is never fully covered by context.
 * The strip is a share of the column rather than a fixed px so a 375px phone
 * and a wide desktop both keep the same proportion.
 */
const STRIP_WIDTH_PERCENT = 46;

/** Gap between lanes when two events run at once. */
const LANE_GAP_PERCENT = 1.5;

/**
 * Google events as readable chips behind the task layer.
 *
 * Replaces the anonymous tinted band: a band told the user an hour was busy but
 * not with what, which meant every meeting cost a click to identify. A chip
 * carries the title and start time inline, so the common case — "what is at
 * 11?" — is answered by looking.
 *
 * The layer participates in NO layout. It is absolutely positioned and its
 * lanes subdivide only its own strip, so an event arriving late can never move
 * a task block.
 */
const GoogleEventChips = ({ events, dayKey, calendars, onSelect }: ChipLayerProps) => {
  const chips = eventChips(events, dayKey);
  if (chips.length === 0) return null;

  return (
    <div
      className="absolute inset-y-0 start-0 z-0"
      style={{ width: `${STRIP_WIDTH_PERCENT}%` }}
      data-testid={`google-chips-${dayKey}`}
    >
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
  const { event, top, height, lane, lanes, isCompact } = chip;

  const color = calendarColor(event.calendarId, calendars);
  const laneWidth = (100 - LANE_GAP_PERCENT * (lanes - 1)) / lanes;

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
        insetInlineStart: `${lane * (laneWidth + LANE_GAP_PERCENT)}%`,
        width: `${laneWidth}%`,
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
