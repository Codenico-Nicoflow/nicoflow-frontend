import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { mockProject } from '@/mocks/handlers';

import { ProjectRow } from './index';

describe('ProjectRow', () => {
  it('renders the project name and status badge', () => {
    renderComponent(<ProjectRow project={mockProject} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Redesign')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('fires onEdit and onDelete from the actions menu', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderComponent(<ProjectRow project={mockProject} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByTestId('project-row-actions-trigger'));
    await user.click(screen.getByTestId('project-row-actions-action-edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('project-row-actions-trigger'));
    await user.click(screen.getByTestId('project-row-actions-action-delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
