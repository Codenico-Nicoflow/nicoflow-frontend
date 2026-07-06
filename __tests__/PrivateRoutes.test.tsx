import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { IUser } from '@/lib/types';
import AppRoutes from '@/router';

import { createMockStore, renderComponent } from './renderComponent';

const mockUser: IUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  theme: 'light',
  language: 'en',
  imageUrl: '',
  status: 'regular',
};

describe('PrivateRoutes', () => {
  it('redirects unauthenticated user to /sign-in', async () => {
    const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
    renderComponent(<AppRoutes />, { store, initialRoute: '/quick-access/bucket' });

    const heading = await screen.findByRole('heading', { name: /welcome back/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders protected content for authenticated user', async () => {
    const store = createMockStore({ auth: { user: mockUser, token: 'mock-token', isLoading: false } });
    renderComponent(<AppRoutes />, { store, initialRoute: '/' });

    // Redirects to /quick-access/today — the Time Spread view; the default MSW
    // returns empty buckets, so the encouraging empty state renders.
    const empty = await screen.findByTestId('timespread-empty');
    expect(empty).toBeInTheDocument();
  });

  it('preserves state.from after redirect to /sign-in', async () => {
    const store = createMockStore({ auth: { user: null, token: null, isLoading: false } });
    renderComponent(<AppRoutes />, { store, initialRoute: '/profile' });

    const heading = await screen.findByRole('heading', { name: /welcome back/i });
    expect(heading).toBeInTheDocument();
  });
});
