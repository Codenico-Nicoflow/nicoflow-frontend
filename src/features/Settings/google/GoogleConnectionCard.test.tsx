import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IGoogleConnection } from '@/lib/store';

import { GoogleConnectionCard } from './GoogleConnectionCard';

const API = 'http://localhost:8080/v1';
const CONNECTION_URL = `${API}/calendar/google/connection`;

const envelope = <T,>(data: T) => HttpResponse.json({ data, error: null });

const connection: IGoogleConnection = {
  googleAccountEmail: 'user@example.com',
  selectedCalendarIds: ['primary'],
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  connectedAt: '2026-08-01T09:00:00Z',
  lastSyncAt: null,
  lastError: null,
};

const notConnected = () =>
  http.get(CONNECTION_URL, () =>
    HttpResponse.json({ data: null, error: { code: 'GOOGLE_NOT_CONNECTED', message: 'no' } }, { status: 409 })
  );

describe('GoogleConnectionCard', () => {
  beforeEach(() => {
    // window.location.assign is not implemented in jsdom.
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() });
  });

  it('shows a skeleton while the connection loads', () => {
    server.use(http.get(CONNECTION_URL, () => new Promise(() => {})));

    renderComponent(<GoogleConnectionCard />);

    expect(screen.getByTestId('google-connection-loading')).toBeInTheDocument();
  });

  it('shows the connected account email and a disconnect control', async () => {
    server.use(http.get(CONNECTION_URL, () => envelope(connection)));

    renderComponent(<GoogleConnectionCard />);

    expect(await screen.findByTestId('google-connection-email')).toHaveTextContent('user@example.com');
    expect(screen.getByTestId('google-disconnect-button')).toBeInTheDocument();
  });

  it('offers connect when there is no connection', async () => {
    server.use(notConnected());

    renderComponent(<GoogleConnectionCard />);

    expect(await screen.findByTestId('google-connect-button')).toBeInTheDocument();
    expect(screen.queryByTestId('google-disconnect-button')).not.toBeInTheDocument();
  });

  it('sends the browser to Google consent on connect', async () => {
    server.use(
      notConnected(),
      http.get(`${API}/calendar/google/connect`, () =>
        envelope({ authUrl: 'https://accounts.google.com/o/oauth2/auth' })
      )
    );

    renderComponent(<GoogleConnectionCard />);
    await userEvent.click(await screen.findByTestId('google-connect-button'));

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth')
    );
  });

  describe('disconnect', () => {
    it('asks for confirmation and states that the grant is revoked with Google', async () => {
      server.use(http.get(CONNECTION_URL, () => envelope(connection)));

      renderComponent(<GoogleConnectionCard />);
      await userEvent.click(await screen.findByTestId('google-disconnect-button'));

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent(/revokes Nicoflow's access with Google/i);
    });

    it('does not disconnect until confirmed', async () => {
      const del = vi.fn();
      server.use(
        http.get(CONNECTION_URL, () => envelope(connection)),
        http.delete(CONNECTION_URL, () => {
          del();
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderComponent(<GoogleConnectionCard />);
      await userEvent.click(await screen.findByTestId('google-disconnect-button'));
      await screen.findByRole('dialog');

      expect(del).not.toHaveBeenCalled();
    });

    it('disconnects once confirmed', async () => {
      const del = vi.fn();
      server.use(
        http.get(CONNECTION_URL, () => envelope(connection)),
        http.delete(CONNECTION_URL, () => {
          del();
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderComponent(<GoogleConnectionCard />);
      await userEvent.click(await screen.findByTestId('google-disconnect-button'));
      await userEvent.click(await screen.findByTestId('confirm-dialog-confirm-button'));

      await waitFor(() => expect(del).toHaveBeenCalled());
    });
  });

  it('surfaces a recorded sync failure rather than leaving it to be discovered', async () => {
    server.use(http.get(CONNECTION_URL, () => envelope({ ...connection, lastError: 'unreachable' })));

    renderComponent(<GoogleConnectionCard />);

    expect(await screen.findByTestId('google-last-error')).toBeInTheDocument();
  });

  it('hides the failure notice on a healthy connection', async () => {
    server.use(http.get(CONNECTION_URL, () => envelope(connection)));

    renderComponent(<GoogleConnectionCard />);

    await screen.findByTestId('google-connection-email');
    expect(screen.queryByTestId('google-last-error')).not.toBeInTheDocument();
  });

  // A refresh token must never reach the DOM in any state.
  it('renders no token material', async () => {
    server.use(http.get(CONNECTION_URL, () => envelope(connection)));

    const { container } = renderComponent(<GoogleConnectionCard />);
    await screen.findByTestId('google-connection-email');

    expect(container.innerHTML).not.toMatch(/refresh[_-]?token/i);
    expect(container.innerHTML).not.toContain('1//0g');
  });
});
