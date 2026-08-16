import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IArea } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/lib/i18n';
import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';

import { AreaDialog } from './index';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockArea: IArea = {
  id: 'area-abc-123',
  name: 'Work',
  color: '#3b82f6',
  icon: 'briefcase',
  displayOrder: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const envelope = <T,>(data: T) => ({ data, error: null });

const fillAreaName = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const nameInput = screen.getByPlaceholderText('Enter area name');
  await user.clear(nameInput);
  await user.type(nameInput, value);
};

describe('AreaDialog — create mode', () => {
  it('shows success toast and posts the area on successful creation', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('http://localhost:8080/v1/areas', async ({ request }) => {
        postedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(envelope({ ...mockArea, name: 'Health' }), { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<AreaDialog open onOpenChange={vi.fn()} />);

    await fillAreaName(user, 'Health');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(i18n.t('errors:AREA_CREATED'));
    });
    expect(toast.error).not.toHaveBeenCalled();
    // Color is sent in the create body (R6): default applied when untouched.
    expect(postedBody).toMatchObject({ name: 'Health', color: '#3B82F6' });
  });

  it('shows the plan-limit upgrade prompt (not a generic error) on PLAN_LIMIT_EXCEEDED', async () => {
    server.use(
      http.post('http://localhost:8080/v1/areas', () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'plan limit exceeded' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<AreaDialog open onOpenChange={vi.fn()} />);

    await fillAreaName(user, 'Blocked Area');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    // Inline upgrade alert renders, AND the toast is the plan-limit one (not generic).
    await waitFor(() => {
      expect(screen.getByTestId('plan-limit-alert')).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(i18n.t('errors:PLAN_LIMIT_EXCEEDED'));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('blocks submit with an empty name (Zod) — no POST fires', async () => {
    const postSpy = vi.fn();
    server.use(
      http.post('http://localhost:8080/v1/areas', () => {
        postSpy();
        return HttpResponse.json(envelope(mockArea), { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderComponent(<AreaDialog open onOpenChange={vi.fn()} />);

    // Submit without typing a name.
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(screen.getByText('Area name is required')).toBeInTheDocument();
    });
    expect(postSpy).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('AreaDialog — edit mode', () => {
  it('pre-populates fields from the existing area', async () => {
    renderComponent(<AreaDialog open onOpenChange={vi.fn()} area={mockArea} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter area name')).toHaveValue('Work');
    });
  });

  it('patches the area and shows the updated toast', async () => {
    let method = '';
    server.use(
      http.patch(`http://localhost:8080/v1/areas/${mockArea.id}`, ({ request }) => {
        method = request.method;
        return HttpResponse.json(envelope({ ...mockArea, name: 'Work Renamed' }));
      })
    );

    const user = userEvent.setup();
    renderComponent(<AreaDialog open onOpenChange={vi.fn()} area={mockArea} />);

    await fillAreaName(user, 'Work Renamed');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(i18n.t('errors:AREA_UPDATED'));
    });
    expect(method).toBe('PATCH');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
