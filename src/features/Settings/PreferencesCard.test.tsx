import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import i18n from '@/lib/i18n';
import { mockUser } from '@/mocks/handlers';

import { PreferencesCard } from './PreferencesCard';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

describe('PreferencesCard', () => {
  // Changing language mutates the shared i18n singleton; restore EN so other
  // suites that assert on English copy aren't affected.
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('PATCHes /users/me with the chosen language when authenticated', async () => {
    let patched: Partial<typeof mockUser> | null = null;
    server.use(
      http.patch('http://localhost:8080/v1/users/me', async ({ request }) => {
        patched = (await request.json()) as Partial<typeof mockUser>;
        return HttpResponse.json({ data: { ...mockUser, ...patched }, error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<PreferencesCard />, { store: authedStore() });

    await user.click(screen.getByTestId('settings-language-select'));
    await user.click(await screen.findByTestId('settings-language-he'));

    await waitFor(() => expect(patched).toEqual({ language: 'he' }));
  });

  it('PATCHes /users/me with the chosen theme when authenticated', async () => {
    let patched: Partial<typeof mockUser> | null = null;
    server.use(
      http.patch('http://localhost:8080/v1/users/me', async ({ request }) => {
        patched = (await request.json()) as Partial<typeof mockUser>;
        return HttpResponse.json({ data: { ...mockUser, ...patched }, error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<PreferencesCard />, { store: authedStore() });

    await user.click(screen.getByTestId('settings-theme-select'));
    await user.click(await screen.findByRole('option', { name: i18n.t('common:theme.dark') }));

    await waitFor(() => expect(patched).toEqual({ theme: 'dark' }));
  });

  it('does not PATCH when "System" theme is chosen (local-only, not a profile value)', async () => {
    let patchCount = 0;
    server.use(
      http.patch('http://localhost:8080/v1/users/me', async ({ request }) => {
        patchCount += 1;
        const body = (await request.json()) as Partial<typeof mockUser>;
        return HttpResponse.json({ data: { ...mockUser, ...body }, error: null });
      })
    );

    const user = userEvent.setup();
    renderComponent(<PreferencesCard />, { store: authedStore() });

    await user.click(screen.getByTestId('settings-theme-select'));
    await user.click(await screen.findByRole('option', { name: i18n.t('common:theme.system') }));

    // Give any (unexpected) request a tick to fire.
    await new Promise(r => setTimeout(r, 50));
    expect(patchCount).toBe(0);
  });
});
