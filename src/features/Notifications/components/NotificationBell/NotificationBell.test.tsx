import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Popover } from '@/components/ui/popover';

import { NotificationBell } from './index';

const API = 'http://localhost:8080/v1';

const countHandler = (count: number) =>
  http.get(`${API}/notifications/unread-count`, () => HttpResponse.json({ data: { count }, error: null }));

const renderBell = () =>
  renderComponent(
    <Popover>
      <NotificationBell />
    </Popover>
  );

describe('NotificationBell', () => {
  it('renders the badge with the unread count', async () => {
    server.use(countHandler(5));
    renderBell();

    await waitFor(() => expect(screen.getByTestId('notification-badge')).toHaveTextContent('5'));
  });

  it('caps the badge at 99+', async () => {
    server.use(countHandler(150));
    renderBell();

    await waitFor(() => expect(screen.getByTestId('notification-badge')).toHaveTextContent('99+'));
  });

  it('shows no badge when the count is zero', async () => {
    server.use(countHandler(0));
    renderBell();

    // Give the query time to resolve, then assert the badge never appears.
    await waitFor(() => expect(screen.getByTestId('notification-bell')).toBeInTheDocument());
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('exposes an accessible label reflecting the count', async () => {
    server.use(countHandler(3));
    renderBell();

    await waitFor(() =>
      expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-label', '3 unread notifications')
    );
  });
});
