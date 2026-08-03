import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';

interface GoogleEventPopoverProps {
  event: IGoogleEvent | null;
  calendars: IGoogleCalendar[];
  onClose: () => void;
}

/**
 * Read-only detail for one Google event (NIC-1863).
 *
 * Deliberately has no edit affordance. Nicoflow holds `calendar.readonly` and
 * writes nothing back, so an editable-looking field would promise something the
 * integration cannot do — a half-edit is worse than an honest link out to
 * Google.
 */
const GoogleEventPopover = ({ event, calendars, onClose }: GoogleEventPopoverProps) => {
  const { t } = useTranslation('task');

  if (!event) return null;

  // Names change and calendars get unshared, so a missing entry falls back to
  // the ID rather than rendering a blank line.
  const calendarName = calendars.find(calendar => calendar.id === event.calendarId)?.summary ?? event.calendarId;

  return (
    <Popover open onOpenChange={open => !open && onClose()}>
      <PopoverAnchor />
      <PopoverContent className="w-72" align="start" data-testid="google-event-popover">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold leading-snug">{event.title}</p>

          <p className="text-xs text-muted-foreground" data-testid="google-event-popover-time">
            {event.allDay ? t('calendar.allDay') : formatEventRange(event)}
          </p>

          <p className="text-xs text-muted-foreground" data-testid="google-event-popover-calendar">
            {calendarName}
          </p>

          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              // noopener/noreferrer: the opened tab must not get a handle on
              // this window via window.opener.
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="google-event-popover-link"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {t('calendar.openInGoogle')}
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * "09:00 – 09:30" from the wire strings.
 *
 * Slices the RFC3339 text rather than constructing a Date: the server already
 * converted to the user's zone, so `new Date(...)` would re-interpret it in the
 * browser's zone and display the wrong hour for a traveller.
 */
const formatEventRange = (event: IGoogleEvent): string => `${event.start.slice(11, 16)} – ${event.end.slice(11, 16)}`;

export default GoogleEventPopover;
