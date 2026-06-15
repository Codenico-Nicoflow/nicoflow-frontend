import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';
import type { IUser } from '@/lib/types';

import { createMockStore, renderComponent } from '../../../../../__tests__/renderComponent';
import { server } from '../../../../../__tests__/server';

import SidebarFooter from './index';

const mockUser: IUser = {
  id: 'usr_1',
  email: 'nico@example.com',
  username: 'nicoflow',
  firstName: 'Nico',
  lastName: 'Flow',
  theme: 'light',
  imageUrl: '',
  status: 'regular',
};

const renderFooter = () => {
  const store = createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });
  renderComponent(
    <SidebarProvider>
      <SidebarFooter />
    </SidebarProvider>,
    { store }
  );
  return { store };
};

describe('SidebarFooter — sign out of all devices', () => {
  it('renders the "Sign out of all devices" action', () => {
    renderFooter();
    expect(screen.getByRole('button', { name: /sign out of all devices/i })).toBeInTheDocument();
  });

  it('calls /auth/logout-all and clears auth after confirming', async () => {
    let logoutAllCalled = false;
    server.use(
      http.post('http://localhost:8080/v1/auth/logout-all', () => {
        logoutAllCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    const { store } = renderFooter();

    await user.click(screen.getByRole('button', { name: /sign out of all devices/i }));
    // Confirm in the dialog.
    await user.click(await screen.findByRole('button', { name: /sign out everywhere/i }));

    await waitFor(() => expect(logoutAllCalled).toBe(true));
    await waitFor(() => expect(store.getState().auth.user).toBeNull());
  });
});
