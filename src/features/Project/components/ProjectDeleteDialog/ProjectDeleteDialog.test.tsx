import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { CONFIRM_DIALOG_CONFIRM_BUTTON } from '@/lib/test_ids';
import { ToastMessages } from '@/lib/utils';

import { renderComponent } from '../../../../../__tests__/renderComponent';
import { server } from '../../../../../__tests__/server';

import { ProjectDeleteDialog } from './index';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const PROJECT_ID = 'project-xyz-456';
const PROJECT_NAME = 'My Project';

describe('ProjectDeleteDialog', () => {
  it('calls success toast and onSuccess after a successful delete', async () => {
    server.use(
      http.delete(`http://localhost:8080/v1/projects/${PROJECT_ID}`, () => new HttpResponse(null, { status: 204 }))
    );

    const onSuccess = vi.fn();
    const user = userEvent.setup();

    renderComponent(
      <ProjectDeleteDialog
        open
        onOpenChange={vi.fn()}
        projectId={PROJECT_ID}
        projectName={PROJECT_NAME}
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(ToastMessages.PROJECT_DELETED);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('calls error toast when delete fails', async () => {
    server.use(
      http.delete(`http://localhost:8080/v1/projects/${PROJECT_ID}`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'INTERNAL_SERVER_ERROR', message: 'server error' } },
          { status: 500 }
        )
      )
    );

    const user = userEvent.setup();

    renderComponent(
      <ProjectDeleteDialog open onOpenChange={vi.fn()} projectId={PROJECT_ID} projectName={PROJECT_NAME} />
    );

    await user.click(screen.getByTestId(CONFIRM_DIALOG_CONFIRM_BUTTON));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
