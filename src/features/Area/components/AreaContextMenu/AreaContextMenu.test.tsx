import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { DIALOG_ACCEPT_BUTTON } from '@/lib/test_ids';
import type { IArea } from '@/lib/types';
import { ToastMessages } from '@/lib/utils';

import { renderComponent } from '../../../../../__tests__/renderComponent';
import { server } from '../../../../../__tests__/server';

import { AreaContextMenu } from './index';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockArea: IArea = {
  id: 'area-abc-123',
  name: 'Test Area',
  color: '#ff0000',
  displayOrder: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const openDeleteDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button'));
  await user.click(screen.getByText('Delete Area'));
};

describe('AreaContextMenu', () => {
  it('calls success toast after a successful delete', async () => {
    server.use(
      http.delete(`http://localhost:8080/v1/areas/${mockArea.id}`, () => new HttpResponse(null, { status: 204 }))
    );

    const user = userEvent.setup();
    renderComponent(<AreaContextMenu area={mockArea} onEdit={vi.fn()} />);

    await openDeleteDialog(user);
    await user.click(screen.getByTestId(DIALOG_ACCEPT_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(ToastMessages.AREA_DELETED);
    });
  });

  it('calls error toast when the delete request fails', async () => {
    server.use(
      http.delete(`http://localhost:8080/v1/areas/${mockArea.id}`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'server error' } },
          { status: 500 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<AreaContextMenu area={mockArea} onEdit={vi.fn()} />);

    await openDeleteDialog(user);
    await user.click(screen.getByTestId(DIALOG_ACCEPT_BUTTON));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
