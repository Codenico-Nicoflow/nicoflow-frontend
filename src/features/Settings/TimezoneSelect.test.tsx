import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { TimezoneSelect } from './TimezoneSelect';

const API = 'http://localhost:8080/v1';

// renderComponent takes a store, not a preloadedState — build one seeded with
// the user whose timezone is under test.
const storeWithUser = (timezone?: string) =>
  createMockStore({
    auth: {
      user: {
        id: 'u1',
        email: 'a@b.c',
        firstName: 'A',
        lastName: 'B',
        username: 'ab',
        theme: 'light' as const,
        language: 'en' as const,
        imageUrl: '',
        status: 'regular' as const,
        timezone: timezone ?? '',
      },
      token: 't',
    },
  });

describe('TimezoneSelect', () => {
  it('shows the stored timezone', () => {
    renderComponent(<TimezoneSelect />, { store: storeWithUser('Asia/Jerusalem') });

    expect(screen.getByTestId('settings-timezone-select')).toHaveTextContent('Asia/Jerusalem');
  });

  it('falls back to the browser zone when the profile has none', () => {
    renderComponent(<TimezoneSelect />, { store: storeWithUser('') });

    // jsdom resolves to a real IANA name; the control must never render empty.
    expect(screen.getByTestId('settings-timezone-select')).not.toHaveTextContent('');
  });

  it('persists a change through PATCH /users/me', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(`${API}/users/me`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { timezone: 'Europe/Paris' }, error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<TimezoneSelect />, { store: storeWithUser('UTC') });

    await user.click(screen.getByTestId('settings-timezone-select'));
    await user.click(await screen.findByTestId('settings-timezone-Europe/Paris'));

    await waitFor(() => expect(body).toEqual({ timezone: 'Europe/Paris' }));
  });

  it('offers a stored zone that is outside the fallback list', () => {
    renderComponent(<TimezoneSelect />, { store: storeWithUser('Antarctica/Troll') });

    expect(screen.getByTestId('settings-timezone-select')).toHaveTextContent('Antarctica/Troll');
  });
});
