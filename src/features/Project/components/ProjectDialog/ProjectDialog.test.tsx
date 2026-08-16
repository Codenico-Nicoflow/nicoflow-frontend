import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IArea, IProject } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/lib/i18n';
import { FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';

import { ProjectDialog } from './index';

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
  displayOrder: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockProject: IProject = {
  id: 'project-xyz-456',
  areaId: 'area-abc-123',
  name: 'My Project',
  status: 'active',
  folderIcon: 'folder',
  isFavorite: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const envelope = <T,>(data: T) => ({ data, error: null });

// GET /v1/areas is paginated: { items, nextCursor }.
const areasPage = (items: IArea[]) => envelope({ items, nextCursor: '' });

const fillProjectName = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const nameInput = screen.getByPlaceholderText('Enter your project name');
  await user.clear(nameInput);
  await user.type(nameInput, value);
};

describe('ProjectDialog — create mode', () => {
  it('shows success toast after successful project creation', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(areasPage([mockArea]))),
      http.post(`http://localhost:8080/v1/areas/${mockArea.id}/projects`, () =>
        HttpResponse.json(envelope(mockProject), { status: 201 })
      )
    );

    const user = userEvent.setup();
    renderComponent(<ProjectDialog open onOpenChange={vi.fn()} />);

    await fillProjectName(user, 'My Project');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(i18n.t('errors:PROJECT_CREATED'));
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows plan-limit toast (not generic error) when PLAN_LIMIT_EXCEEDED', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(areasPage([mockArea]))),
      http.post(`http://localhost:8080/v1/areas/${mockArea.id}/projects`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'plan limit exceeded' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    renderComponent(<ProjectDialog open onOpenChange={vi.fn()} />);

    await fillProjectName(user, 'Blocked Project');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(i18n.t('errors:PLAN_LIMIT_EXCEEDED'));
    });
    // Generic error toast must NOT fire — only the plan-limit one
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('ProjectDialog — no areas guard', () => {
  it('shows the "create an area first" guard instead of the form when there are no areas', async () => {
    server.use(http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(areasPage([]))));

    renderComponent(<ProjectDialog open onOpenChange={vi.fn()} onCreateArea={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Create an Area first')).toBeInTheDocument();
    });
    // The project form must not be reachable with zero areas.
    expect(screen.queryByPlaceholderText('Enter your project name')).not.toBeInTheDocument();
  });

  it('closes the dialog and invokes onCreateArea when the user chooses to create an area', async () => {
    server.use(http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(areasPage([]))));

    const onOpenChange = vi.fn();
    const onCreateArea = vi.fn();
    const user = userEvent.setup();
    renderComponent(<ProjectDialog open onOpenChange={onOpenChange} onCreateArea={onCreateArea} />);

    await waitFor(() => {
      expect(screen.getByText('Create an Area first')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create Area' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreateArea).toHaveBeenCalledTimes(1);
  });
});

describe('ProjectDialog — edit mode', () => {
  it('shows success toast after successful project update', async () => {
    server.use(
      http.get('http://localhost:8080/v1/areas', () => HttpResponse.json(areasPage([mockArea]))),
      http.patch(`http://localhost:8080/v1/projects/${mockProject.id}`, () =>
        HttpResponse.json(envelope({ ...mockProject, name: 'Renamed Project' }))
      )
    );

    const user = userEvent.setup();
    renderComponent(<ProjectDialog open onOpenChange={vi.fn()} project={mockProject} />);

    await fillProjectName(user, ' Updated');
    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(i18n.t('errors:PROJECT_UPDATED'));
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
