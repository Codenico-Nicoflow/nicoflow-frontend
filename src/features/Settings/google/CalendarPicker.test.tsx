import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { type IGoogleCalendar, MAX_SELECTED_CALENDARS } from '@/lib/store';

import { CalendarPicker } from './CalendarPicker';

const API = 'http://localhost:8080/v1';
const CALENDARS_URL = `${API}/calendar/google/calendars`;

const envelope = <T,>(data: T) => HttpResponse.json({ data, error: null });

const calendar = (id: string, selected: boolean, summary = id): IGoogleCalendar => ({
  id,
  summary,
  backgroundColor: '#4285f4',
  primary: id === 'primary',
  selected,
});

const listHandler = (calendars: IGoogleCalendar[]) => http.get(CALENDARS_URL, () => envelope(calendars));

describe('CalendarPicker', () => {
  it('shows a skeleton while the calendars load', () => {
    server.use(http.get(CALENDARS_URL, () => new Promise(() => {})));

    renderComponent(<CalendarPicker />);

    expect(screen.getByTestId('google-calendar-picker-loading')).toBeInTheDocument();
  });

  it('lists calendars with their Google names and colours', async () => {
    server.use(listHandler([calendar('primary', true, 'Personal'), calendar('team@example.com', false, 'Team')]));

    renderComponent(<CalendarPicker />);

    expect(await screen.findByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('reflects which calendars are selected', async () => {
    server.use(listHandler([calendar('primary', true, 'Personal'), calendar('team@example.com', false, 'Team')]));

    renderComponent(<CalendarPicker />);

    expect(await screen.findByRole('checkbox', { name: 'Personal' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Team' })).not.toBeChecked();
  });

  it('persists a selection change', async () => {
    const put = vi.fn();
    server.use(
      listHandler([calendar('primary', true, 'Personal'), calendar('team@example.com', false, 'Team')]),
      http.put(CALENDARS_URL, async ({ request }) => {
        put(await request.json());
        return envelope([calendar('primary', true, 'Personal'), calendar('team@example.com', true, 'Team')]);
      })
    );

    renderComponent(<CalendarPicker />);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Team' }));

    await waitFor(() => expect(put).toHaveBeenCalledWith({ calendarIds: ['primary', 'team@example.com'] }));
  });

  it('sends calendar IDs rather than display names', async () => {
    const put = vi.fn();
    server.use(
      listHandler([calendar('team@example.com', false, 'Team')]),
      http.put(CALENDARS_URL, async ({ request }) => {
        put(await request.json());
        return envelope([calendar('team@example.com', true, 'Team')]);
      })
    );

    renderComponent(<CalendarPicker />);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Team' }));

    await waitFor(() => expect(put).toHaveBeenCalledWith({ calendarIds: ['team@example.com'] }));
  });

  describe('at the selection cap', () => {
    const atCap = [
      ...Array.from({ length: MAX_SELECTED_CALENDARS }, (_, i) => calendar(`c${i}`, true, `Cal ${i}`)),
      calendar('extra', false, 'Extra'),
    ];

    it('disables unselected calendars and states the reason', async () => {
      server.use(listHandler(atCap));

      renderComponent(<CalendarPicker />);

      expect(await screen.findByRole('checkbox', { name: 'Extra' })).toBeDisabled();
      expect(screen.getByTestId('google-calendar-picker-cap')).toHaveTextContent(String(MAX_SELECTED_CALENDARS));
    });

    // Un-checking must stay available, or a user at the cap is trapped.
    it('leaves selected calendars toggleable', async () => {
      server.use(listHandler(atCap));

      renderComponent(<CalendarPicker />);

      expect(await screen.findByRole('checkbox', { name: 'Cal 0' })).toBeEnabled();
    });

    it('does not send an over-cap selection when a disabled control is activated', async () => {
      const put = vi.fn();
      server.use(
        listHandler(atCap),
        http.put(CALENDARS_URL, async ({ request }) => {
          put(await request.json());
          return envelope(atCap);
        })
      );

      renderComponent(<CalendarPicker />);
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Extra' }));

      await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Extra' })).toBeDisabled());
      expect(put).not.toHaveBeenCalled();
    });
  });

  it('renders a message when Google cannot be reached', async () => {
    server.use(
      http.get(CALENDARS_URL, () =>
        HttpResponse.json({ data: null, error: { code: 'GOOGLE_AUTH_FAILED', message: 'nope' } }, { status: 502 })
      )
    );

    renderComponent(<CalendarPicker />);

    expect(await screen.findByTestId('google-calendar-picker-error')).toBeInTheDocument();
  });

  it('renders an empty state when the account has no calendars', async () => {
    server.use(listHandler([]));

    renderComponent(<CalendarPicker />);

    expect(await screen.findByTestId('google-calendar-picker-empty')).toBeInTheDocument();
  });

  // A stale selection must not render as a phantom row — the server drops it,
  // so the picker shows only what still exists.
  it('shows only the calendars the server returns', async () => {
    server.use(listHandler([calendar('primary', true, 'Personal')]));

    renderComponent(<CalendarPicker />);

    await screen.findByText('Personal');
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });
});
