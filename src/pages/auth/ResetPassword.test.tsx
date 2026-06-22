import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import AppRoutes from '@/router';

import { createMockStore, renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';

const renderResetPassword = (token?: string) => {
  const route = token ? `/reset-password?token=${token}` : '/reset-password';
  const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
  renderComponent(<AppRoutes />, { store, initialRoute: route });
  return { store };
};

const fillAndSubmitReset = async (user: ReturnType<typeof userEvent.setup>, password = 'NewPassword1') => {
  const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
  if (!newPass || !confirmPass) throw new Error('Expected two password inputs');
  await user.type(newPass, password);
  await user.type(confirmPass, password);
  await user.click(screen.getByRole('button', { name: /reset password/i }));
};

describe('ResetPassword page', () => {
  it('shows invalid link state when no token in URL', () => {
    renderResetPassword();
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a new link/i })).toBeInTheDocument();
  });

  it('renders new password and confirm password fields when token is present', () => {
    renderResetPassword('valid-token-abc');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    expect(passwordInputs).toHaveLength(2);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('navigates to sign-in on successful password reset', async () => {
    const user = userEvent.setup();
    renderResetPassword('valid-token-abc');

    await fillAndSubmitReset(user);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/sign-in');
    });
  });

  it('stays on reset form when server returns an error', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/reset-password', () =>
        HttpResponse.json({ code: 'INVALID_TOKEN', message: 'Token expired' }, { status: 400 })
      )
    );

    const user = userEvent.setup();
    renderResetPassword('expired-token');

    await fillAndSubmitReset(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });
  });
});
