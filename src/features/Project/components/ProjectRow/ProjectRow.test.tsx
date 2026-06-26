import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeProject, mockProject } from '@/mocks/handlers';

import { ProjectRow } from './index';

// Spy on navigation so we can assert action clicks don't trigger the row's
// navigate-on-click (the bug: picking Edit/Delete/Open also opened the project).
const navigateSpy = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateSpy };
});

// Spy on LazyIcon so we can assert which iconId the row reads, without
// depending on the async Suspense-loaded SVG. The regression (R15) is that the
// row reads project.folderIcon, NOT a removed project.icon field.
const lazyIconSpy = vi.fn();
vi.mock('@/components', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components')>();
  return {
    ...actual,
    LazyIcon: (props: { iconId: string }) => {
      lazyIconSpy(props.iconId);
      return <span data-testid="lazy-icon" data-icon-id={props.iconId} />;
    },
  };
});

describe('ProjectRow', () => {
  it('renders the project name and status badge', () => {
    renderComponent(<ProjectRow project={mockProject} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Redesign')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('reads project.folderIcon for the row icon (R15 regression)', () => {
    lazyIconSpy.mockClear();
    const project = makeProject({ folderIcon: 'rocket' });
    renderComponent(<ProjectRow project={project} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(lazyIconSpy).toHaveBeenCalledWith('rocket');
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

  it('does not navigate when an action menu item is clicked', async () => {
    navigateSpy.mockClear();
    const user = userEvent.setup();

    renderComponent(<ProjectRow project={mockProject} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('project-row-actions-trigger'));
    await user.click(screen.getByTestId('project-row-actions-action-edit'));

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to the project when the row body is clicked', async () => {
    navigateSpy.mockClear();
    const user = userEvent.setup();

    renderComponent(<ProjectRow project={mockProject} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByText('Redesign'));

    expect(navigateSpy).toHaveBeenCalledWith(`/projects/${mockProject.id}`);
  });
});
