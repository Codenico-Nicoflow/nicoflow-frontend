import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import AppRoutes from '@/router';

import { createMockStore, renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';

const renderVerifyEmail = (token?: string) => {
  const route = token ? `/verify-email?token=${token}` : '/verify-email';
  const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
  renderComponent(<AppRoutes />, { store, initialRoute: route });
  return { store };
};

describe('VerifyEmail page', () => {
  it('shows invalid link state when no token is present in the URL', () => {
    renderVerifyEmail();
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('shows the success screen on a valid token (does not redirect instantly)', async () => {
    // The default MSW handler returns a success envelope for verify-email.
    renderVerifyEmail('valid-token-abc');

    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
    // The confirmation screen must be visible — not skipped by an instant redirect.
    expect(window.location.pathname).toBe('/verify-email');
    expect(screen.getByRole('link', { name: /continue to sign in/i })).toBeInTheDocument();
  });

  it('auto-redirects to sign-in shortly after a successful verification', async () => {
    renderVerifyEmail('valid-token-abc');

    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
    // Timer-driven redirect (3s); generous timeout so it is not flaky.
    await waitFor(() => expect(window.location.pathname).toBe('/sign-in'), { timeout: 5000 });
  });

  it('lets the user skip the wait via the continue button', async () => {
    const user = userEvent.setup();
    renderVerifyEmail('valid-token-abc');

    const link = await screen.findByRole('link', { name: /continue to sign in/i });
    await user.click(link);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/sign-in');
    });
  });

  it('shows the failure state when the server rejects the token', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/verify-email', () =>
        HttpResponse.json({ data: null, error: { code: 'INVALID_TOKEN', message: 'Token expired' } }, { status: 401 })
      )
    );

    renderVerifyEmail('expired-token');

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
    // Must NOT redirect on failure — the user stays on the verify-email page.
    expect(window.location.pathname).toBe('/verify-email');
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });
});
