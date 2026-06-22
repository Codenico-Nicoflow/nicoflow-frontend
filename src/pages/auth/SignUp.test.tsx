import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import AppRoutes from '@/router';

import { createMockStore, renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';

const fillAndSubmitSignUp = async (
  user: ReturnType<typeof userEvent.setup>,
  username = 'testuser',
  email = 'test@example.com',
  password = 'Password1'
) => {
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/email/i), email);
  // Password input is wrapped in a div (eye-toggle); target by placeholder
  await user.type(screen.getByPlaceholderText('••••••••'), password);
  await user.click(screen.getByRole('button', { name: /create account/i }));
};

const renderSignUp = () => {
  const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
  renderComponent(<AppRoutes />, { store, initialRoute: '/sign-up' });
  return { store };
};

describe('SignUp page', () => {
  it('renders username, email, password inputs and submit button', () => {
    renderSignUp();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows the check-your-email panel after successful registration (no auto-login)', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await fillAndSubmitSignUp(user);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    // Register no longer logs the user in — stays on the sign-up route, not into the app.
    expect(window.location.pathname).toBe('/sign-up');
    expect(screen.getByRole('link', { name: /go to sign in/i })).toBeInTheDocument();
  });

  it('does not put a token or user into the store after registration', async () => {
    const user = userEvent.setup();
    const { store } = renderSignUp();

    await fillAndSubmitSignUp(user);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    const auth = store.getState().auth;
    expect(auth.token).toBeNull();
    expect(auth.user).toBeNull();
  });

  it('stays on sign-up when registration fails', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/register', () =>
        HttpResponse.json({ code: 'EMAIL_TAKEN', message: 'Email already in use' }, { status: 409 })
      )
    );

    const user = userEvent.setup();
    renderSignUp();

    await fillAndSubmitSignUp(user, 'testuser', 'taken@example.com');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/sign-up');
    });
  });
});
