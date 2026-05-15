import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Edit, Trash } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { type ItemAction, ItemActionsMenu } from '.';

describe('ItemActionsMenu', () => {
  it('renders the trigger button', () => {
    const actions: ItemAction[] = [{ label: 'Edit', icon: Edit, onClick: vi.fn() }];

    renderComponent(<ItemActionsMenu actions={actions} />);

    expect(screen.getByTestId('item-actions-menu-trigger')).toBeInTheDocument();
  });

  it('renders actions in dropdown after clicking trigger', async () => {
    const user = userEvent.setup();
    const actions: ItemAction[] = [
      { label: 'Edit', icon: Edit, onClick: vi.fn() },
      { label: 'Delete', icon: Trash, onClick: vi.fn(), destructive: true },
    ];

    renderComponent(<ItemActionsMenu actions={actions} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('clicking an action calls its onClick handler', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    const actions: ItemAction[] = [{ label: 'Edit', icon: Edit, onClick: handleEdit }];

    renderComponent(<ItemActionsMenu actions={actions} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));
    await user.click(screen.getByText('Edit'));

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('renders destructive action without crashing', async () => {
    const user = userEvent.setup();
    const actions: ItemAction[] = [{ label: 'Remove', icon: Trash, onClick: vi.fn(), destructive: true }];

    renderComponent(<ItemActionsMenu actions={actions} />);

    await user.click(screen.getByTestId('item-actions-menu-trigger'));

    expect(screen.getByText('Remove')).toBeInTheDocument();
  });
});
