import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import AppRoutes from '@/router';

const renderForgotPassword = () => {
  const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
  renderComponent(<AppRoutes />, { store, initialRoute: '/forgot-password' });
  return { store };
};

describe('ForgotPassword page', () => {
  it('renders email input and submit button', () => {
    renderForgotPassword();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows success state with submitted email after form submission', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    });
  });

  it('stays on form when server returns an error', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/forgot-password', () =>
        HttpResponse.json({ code: 'SERVER_ERROR', message: 'Internal server error' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });
  });

  it('"Try another email" button resets back to the form', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try another email/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /try another email/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });
  });
});
