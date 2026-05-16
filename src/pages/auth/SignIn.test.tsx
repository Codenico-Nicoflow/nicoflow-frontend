import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockAuthResponse } from '@/mocks/handlers';
import AppRoutes from '@/router';

import { createMockStore, renderComponent } from '../../../__tests__/renderComponent';
import { server } from '../../../__tests__/server';

const fillAndSubmitSignIn = async (
  user: ReturnType<typeof userEvent.setup>,
  email = 'test@example.com',
  password = 'Password1'
) => {
  await user.type(screen.getByLabelText(/email/i), email);
  // Password input is wrapped in a div (eye-toggle); target by placeholder
  await user.type(screen.getByPlaceholderText('••••••••'), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
};

const renderSignIn = () => {
  const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
  renderComponent(<AppRoutes />, { store, initialRoute: '/sign-in' });
  return { store };
};

describe('SignIn page', () => {
  it('renders email, password inputs and submit button', () => {
    renderSignIn();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('navigates away from sign-in after successful login', async () => {
    const user = userEvent.setup();
    renderSignIn();

    await fillAndSubmitSignIn(user);

    await waitFor(() => {
      expect(window.location.pathname).not.toBe('/sign-in');
    });
  });

  it('stays on sign-in when credentials are wrong', async () => {
    server.use(
      http.post('http://localhost:8080/v1/auth/login', () =>
        HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    renderSignIn();

    await fillAndSubmitSignIn(user, 'wrong@example.com', 'wrongpass1A');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/sign-in');
    });
  });

  it('dispatches token and user into store after successful login', async () => {
    const user = userEvent.setup();
    const { store } = renderSignIn();

    await fillAndSubmitSignIn(user);

    await waitFor(() => {
      const auth = store.getState().auth;
      expect(auth.token).toBe(mockAuthResponse.token);
      expect(auth.user).toEqual(mockAuthResponse.user);
    });
  });
});
