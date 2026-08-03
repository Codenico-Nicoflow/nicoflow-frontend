import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';

import GoogleEventPopover from './GoogleEventPopover';

const event: IGoogleEvent = {
  id: 'evt-1',
  title: 'Design review',
  start: '2026-08-03T09:00:00+03:00',
  end: '2026-08-03T10:30:00+03:00',
  allDay: false,
  calendarId: 'team@example.com',
  htmlLink: 'https://calendar.google.com/evt-1',
};

const calendars: IGoogleCalendar[] = [
  { id: 'team@example.com', summary: 'Team', backgroundColor: '#0b8043', primary: false, selected: true },
];

describe('GoogleEventPopover', () => {
  it('renders nothing without an event', () => {
    renderComponent(<GoogleEventPopover event={null} calendars={calendars} onClose={vi.fn()} />);

    expect(screen.queryByTestId('google-event-popover')).not.toBeInTheDocument();
  });

  it('shows the title, time and source calendar', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    expect(await screen.findByText('Design review')).toBeInTheDocument();
    expect(screen.getByTestId('google-event-popover-time')).toHaveTextContent('09:00');
    expect(screen.getByTestId('google-event-popover-time')).toHaveTextContent('10:30');
    expect(screen.getByTestId('google-event-popover-calendar')).toHaveTextContent('Team');
  });

  // The server already converted to the user's zone; re-parsing via Date would
  // re-interpret it in the browser's zone and show the wrong hour.
  it('renders the time as sent rather than re-deriving it locally', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    // 09:00+03:00 is 06:00Z — a local re-derivation would show 06:00 under a
    // UTC test environment.
    expect(await screen.findByTestId('google-event-popover-time')).not.toHaveTextContent('06:00');
  });

  it('links out to Google in a new tab, without leaking the opener', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    const link = await screen.findByTestId('google-event-popover-link');
    expect(link).toHaveAttribute('href', 'https://calendar.google.com/evt-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  // Nicoflow holds calendar.readonly, so a half-edit would promise something
  // the integration cannot do.
  it('offers nothing editable', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    await screen.findByTestId('google-event-popover');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save|edit|delete/i })).not.toBeInTheDocument();
  });

  it('falls back to the calendar id when the calendar is unknown', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={[]} onClose={vi.fn()} />);

    expect(await screen.findByTestId('google-event-popover-calendar')).toHaveTextContent('team@example.com');
  });

  it('labels an all-day event rather than showing a time range', async () => {
    const allDay: IGoogleEvent = { ...event, allDay: true, start: '2026-08-03', end: '2026-08-04' };
    renderComponent(<GoogleEventPopover event={allDay} calendars={calendars} onClose={vi.fn()} />);

    expect(await screen.findByTestId('google-event-popover-time')).not.toHaveTextContent(':');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={onClose} />);

    await screen.findByTestId('google-event-popover');
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('renders no link when Google supplied none', async () => {
    renderComponent(<GoogleEventPopover event={{ ...event, htmlLink: '' }} calendars={calendars} onClose={vi.fn()} />);

    await screen.findByTestId('google-event-popover');
    expect(screen.queryByTestId('google-event-popover-link')).not.toBeInTheDocument();
  });
});
