import type { LucideIcon } from 'lucide-react';
import { CalendarDays, ExternalLink, MapPin, User, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { cn } from '@/lib/utils';

import { calendarColor, withAlpha } from '../googleColor';
import { durationParts, eventDurationMinutes, eventRange } from '../googleEventTime';

interface GoogleEventPopoverProps {
  event: IGoogleEvent | null;
  calendars: IGoogleCalendar[];
  onClose: () => void;
}

/**
 * Read-only detail for one Google event (NIC-1863, expanded NIC-1881).
 *
 * Deliberately has no edit affordance. Nicoflow holds `calendar.readonly` and
 * writes nothing back, so an editable-looking field would promise something the
 * integration cannot do — a half-edit is worse than an honest link out.
 *
 * A dialog rather than a popover: the popover had no anchor element (the chip
 * lives in an absolutely-positioned layer that unmounts as the grid scrolls), so
 * it rendered against the viewport origin. A centred dialog is honest about
 * having no anchor, and gives the detail room it did not have in a 288px card.
 */
const GoogleEventPopover = ({ event, calendars, onClose }: GoogleEventPopoverProps) => {
  const { t } = useTranslation('task');

  if (!event) return null;

  // Names change and calendars get unshared, so a missing entry falls back to
  // the ID rather than rendering a blank line.
  const calendarName = calendars.find(calendar => calendar.id === event.calendarId)?.summary ?? event.calendarId;
  const color = calendarColor(event.calendarId, calendars);
  const isDeclined = event.responseStatus === 'declined';

  /**
   * "09:00 – 09:30 · 30 min" — the range plus how long it actually runs.
   *
   * The duration is spelled out rather than left for the reader to subtract; it
   * is usually the thing being checked when a meeting is opened at all.
   */
  const timeLine = (): string => {
    const range = eventRange(event);
    const total = eventDurationMinutes(event);
    if (total === null || total <= 0) return range;

    const { hours, minutes } = durationParts(total);
    // A whole number of hours reads as "2h", not "2h 0m".
    const duration =
      hours === 0
        ? t('calendar.minutesShort', { minutes })
        : minutes === 0
          ? t('calendar.durationHours', { hours })
          : t('calendar.durationHm', { hours, minutes });
    return `${range} · ${duration}`;
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md" data-testid="google-event-popover">
        {/* The calendar's colour as a header rule — the same hue the chip
            carries, so the dialog is visibly about the block that was clicked. */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-lg" style={{ backgroundColor: color }} aria-hidden />

        <DialogHeader>
          <DialogTitle className={cn('text-start text-base leading-snug', isDeclined && 'line-through')}>
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-start" data-testid="google-event-popover-time">
            {event.allDay ? t('calendar.allDay') : timeLine()}
          </DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-3 text-sm">
          <Row icon={CalendarDays} label={t('calendar.eventCalendar')} testId="google-event-popover-calendar">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${withAlpha(color, 0.18)}` }}
                aria-hidden
              />
              {calendarName}
            </span>
          </Row>

          {event.location && (
            <Row icon={MapPin} label={t('calendar.eventLocation')} testId="google-event-popover-location">
              {/* Not linkified: a location is free text and may be a room, an
                  address or a paste. Guessing which is a URL gets it wrong in
                  exactly the cases that matter. */}
              <span className="break-words">{event.location}</span>
            </Row>
          )}

          {event.organizer && (
            <Row icon={User} label={t('calendar.eventOrganizer')} testId="google-event-popover-organizer">
              <span className="break-all">{event.organizer}</span>
            </Row>
          )}

          {/* One attendee is the organizer alone, which tells the user nothing. */}
          {typeof event.attendeeCount === 'number' && event.attendeeCount > 1 && (
            <Row icon={Users} label={t('calendar.eventAttendees')} testId="google-event-popover-attendees">
              {t('calendar.eventAttendeeCount', { count: event.attendeeCount })}
              {event.responseStatus && event.responseStatus !== 'needsAction' && (
                <span className="ms-2 text-muted-foreground">{t(`calendar.rsvp.${event.responseStatus}`)}</span>
              )}
            </Row>
          )}

          {event.description && (
            <div className="border-t border-border/60 pt-3" data-testid="google-event-popover-description">
              {/* Server already flattened Google's HTML to text and truncated it,
                  so this renders as plain text and never as markup. */}
              <p className="whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            </div>
          )}
        </dl>

        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            // noopener/noreferrer: the opened tab must not get a handle on this
            // window via window.opener.
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="google-event-popover-link"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {t('calendar.openInGoogle')}
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface RowProps {
  icon: LucideIcon;
  label: string;
  testId: string;
  children: ReactNode;
}

/**
 * One labelled detail line.
 *
 * The visible icon is decorative and the real label is screen-reader-only: an
 * icon alone leaves a non-sighted user to infer that a bare address means
 * "location", which is guesswork the markup can simply state.
 */
const Row = ({ icon: Icon, label, testId, children }: RowProps) => (
  <div className="flex items-start gap-2.5" data-testid={testId}>
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    <dt className="sr-only">{label}</dt>
    <dd className="min-w-0 text-foreground/90">{children}</dd>
  </div>
);

export default GoogleEventPopover;
