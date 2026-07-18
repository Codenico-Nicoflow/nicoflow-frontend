import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import i18n from '@/lib/i18n';
import { mockUser } from '@/mocks/handlers';

import { SecurityCard } from './SecurityCard';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'old-token', isLoading: false } });

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(i18n.t('common:pages.settings.currentPasswordLabel')), 'OldPass1');
  await user.type(screen.getByLabelText(i18n.t('common:pages.settings.newPasswordLabel')), 'NewPass1');
  await user.type(screen.getByLabelText(i18n.t('common:pages.settings.confirmPasswordLabel')), 'NewPass1');
  await user.click(screen.getByRole('button', { name: i18n.t('common:pages.settings.changePasswordButton') }));
};

describe('SecurityCard', () => {
  it('persists the new token pair on a successful change', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/change-password', () =>
        HttpResponse.json({
          data: { token: 'new-token', refreshToken: 'new-refresh', user: mockUser },
          error: null,
        })
      )
    );

    const user = userEvent.setup();
    const store = authedStore();
    renderComponent(<SecurityCard />, { store });
    await fillForm(user);

    await waitFor(() => expect(store.getState().auth.token).toBe('new-token'));
  });

  it('shows a field error on 401 (wrong current password) and keeps the old token', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/change-password', () =>
        HttpResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'wrong' } }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    const store = authedStore();
    renderComponent(<SecurityCard />, { store });
    await fillForm(user);

    expect(await screen.findByText(i18n.t('common:pages.settings.currentPasswordIncorrect'))).toBeInTheDocument();
    expect(store.getState().auth.token).toBe('old-token');
  });
});
