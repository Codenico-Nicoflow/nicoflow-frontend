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

  it('states how long the event runs rather than leaving the reader to subtract', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    expect(await screen.findByTestId('google-event-popover-time')).toHaveTextContent('1h 30m');
  });

  it('shows location, organizer and guest count when Google sent them', async () => {
    const detailed: IGoogleEvent = {
      ...event,
      location: 'Room 4',
      organizer: 'Lead',
      attendeeCount: 3,
      responseStatus: 'accepted',
    };
    renderComponent(<GoogleEventPopover event={detailed} calendars={calendars} onClose={vi.fn()} />);

    expect(await screen.findByTestId('google-event-popover-location')).toHaveTextContent('Room 4');
    expect(screen.getByTestId('google-event-popover-organizer')).toHaveTextContent('Lead');
    expect(screen.getByTestId('google-event-popover-attendees')).toHaveTextContent('3 guests');
  });

  // Detail fields are omitempty on the wire, so absent must render nothing at
  // all rather than an empty labelled row.
  it('omits detail rows the event does not carry', async () => {
    renderComponent(<GoogleEventPopover event={event} calendars={calendars} onClose={vi.fn()} />);

    await screen.findByTestId('google-event-popover');
    expect(screen.queryByTestId('google-event-popover-location')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-event-popover-organizer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-event-popover-description')).not.toBeInTheDocument();
  });

  // One guest is the organizer alone, which tells the user nothing.
  it('hides the guest row for a solo event', async () => {
    renderComponent(
      <GoogleEventPopover event={{ ...event, attendeeCount: 1 }} calendars={calendars} onClose={vi.fn()} />
    );

    await screen.findByTestId('google-event-popover');
    expect(screen.queryByTestId('google-event-popover-attendees')).not.toBeInTheDocument();
  });

  // The server already flattened Google's HTML, so this must appear as text.
  it('renders the description as text, never as markup', async () => {
    const withNotes: IGoogleEvent = { ...event, description: 'Agenda: <b>ship it</b>' };
    renderComponent(<GoogleEventPopover event={withNotes} calendars={calendars} onClose={vi.fn()} />);

    const description = await screen.findByTestId('google-event-popover-description');
    expect(description).toHaveTextContent('Agenda: <b>ship it</b>');
    expect(description.querySelector('b')).toBeNull();
  });

  it('strikes through an event the user declined', async () => {
    const declined: IGoogleEvent = { ...event, responseStatus: 'declined' };
    renderComponent(<GoogleEventPopover event={declined} calendars={calendars} onClose={vi.fn()} />);

    expect(await screen.findByText('Design review')).toHaveClass('line-through');
  });

  it('renders no link when Google supplied none', async () => {
    renderComponent(<GoogleEventPopover event={{ ...event, htmlLink: '' }} calendars={calendars} onClose={vi.fn()} />);

    await screen.findByTestId('google-event-popover');
    expect(screen.queryByTestId('google-event-popover-link')).not.toBeInTheDocument();
  });
});
