import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import i18n from '@/lib/i18n';
import { mockUser } from '@/mocks/handlers';

import { AccountCard } from './AccountCard';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

describe('AccountCard', () => {
  it('shows email and username read-only (disabled)', () => {
    renderComponent(<AccountCard />, { store: authedStore() });

    const email = screen.getByDisplayValue(mockUser.email);
    const username = screen.getByDisplayValue(mockUser.username);
    expect(email).toBeDisabled();
    expect(username).toBeDisabled();
  });

  it('PATCHes /users/me with the edited name and updates the store user', async () => {
    let patched: Record<string, unknown> | null = null;
    server.use(
      http.patch('http://localhost:8080/v1/users/me', async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...mockUser, ...patched }, error: null });
      })
    );

    const user = userEvent.setup();
    const store = authedStore();
    renderComponent(<AccountCard />, { store });

    const firstName = screen.getByLabelText(i18n.t('common:pages.settings.firstNameLabel'));
    await user.clear(firstName);
    await user.type(firstName, 'Jane');
    await user.click(screen.getByRole('button', { name: i18n.t('common:pages.settings.saveButton') }));

    await waitFor(() => expect(patched).toEqual({ firstName: 'Jane', lastName: mockUser.lastName }));
    await waitFor(() => expect(store.getState().auth.user?.firstName).toBe('Jane'));
  });

  it('disables save while the form is pristine', () => {
    renderComponent(<AccountCard />, { store: authedStore() });
    expect(screen.getByRole('button', { name: i18n.t('common:pages.settings.saveButton') })).toBeDisabled();
  });
});
