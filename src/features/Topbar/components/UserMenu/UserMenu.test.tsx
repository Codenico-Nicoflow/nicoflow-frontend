import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/lib/i18n';
import { DIALOG_ACCEPT_BUTTON } from '@/lib/test_ids';
import { mockUser } from '@/mocks/handlers';

import { server } from '../../../../../__tests__/server';

import { UserMenu } from './index';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderWithUser = () =>
  renderComponent(<UserMenu />, {
    store: createMockStore({ auth: { user: mockUser, token: 'tkn' } }),
  });

describe('UserMenu', () => {
  it('renders the account trigger when logged in', () => {
    renderWithUser();
    expect(screen.getByTestId('user-menu-trigger')).toBeInTheDocument();
  });

  it('logs out of all devices via the confirm dialog and hits /auth/logout-all', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post('http://localhost:8080/v1/auth/logout-all', () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderWithUser();

    await user.click(screen.getByTestId('user-menu-trigger'));
    await user.click(screen.getByTestId('user-menu-logout-all'));
    await user.click(await screen.findByTestId(DIALOG_ACCEPT_BUTTON));

    await waitFor(() => expect(called).toBe(true));
    expect(toast.success).toHaveBeenCalledWith(i18n.t('errors:LOGGED_OUT_ALL_DEVICES_SUCCESSFULLY'));
  });
});
