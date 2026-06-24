import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AreaWithProjects } from '@/lib/store/slices/area/type';

import { renderComponent } from '../../../../../__tests__/renderComponent';

import { AreaCard } from './index';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const areaWithProjects: AreaWithProjects = {
  id: 'area-1',
  name: 'Work',
  color: '#3b82f6',
  icon: 'briefcase',
  displayOrder: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  projects: [
    {
      id: 'p1',
      areaId: 'area-1',
      name: 'Alpha',
      status: 'active',
      folderIcon: 'rocket',
      isFavorite: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'p2',
      areaId: 'area-1',
      name: 'Beta',
      status: 'active',
      folderIcon: 'folder',
      isFavorite: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

describe('AreaCard', () => {
  it('renders the area name, project count badge, and a row per project', () => {
    renderComponent(<AreaCard area={areaWithProjects} />);

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    // count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows the empty hint when the area has no projects', () => {
    renderComponent(<AreaCard area={{ ...areaWithProjects, projects: [] }} />);

    expect(screen.getByText('No projects yet — add one below.')).toBeInTheDocument();
  });

  it('disables the Delete action for the protected "General" area', async () => {
    const user = userEvent.setup();
    renderComponent(<AreaCard area={{ ...areaWithProjects, name: 'General', projects: [] }} data-testid="area-card" />);

    await user.click(screen.getByTestId('area-card-actions-trigger'));

    const deleteItem = await screen.findByTestId('area-card-actions-action-delete-area');
    expect(deleteItem).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the Delete action enabled for a regular area', async () => {
    const user = userEvent.setup();
    renderComponent(<AreaCard area={areaWithProjects} data-testid="area-card" />);

    await user.click(screen.getByTestId('area-card-actions-trigger'));

    await waitFor(() => {
      const deleteItem = screen.getByTestId('area-card-actions-action-delete-area');
      expect(deleteItem).not.toHaveAttribute('aria-disabled', 'true');
    });
  });
});
