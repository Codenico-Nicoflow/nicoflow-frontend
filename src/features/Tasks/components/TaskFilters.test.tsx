import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TaskEnergy } from '@/lib/types';

import { renderComponent } from '../../../../__tests__/renderComponent';

import TaskFilters, { type TaskCounts } from './TaskFilters';

const counts: TaskCounts = { all: 8, inbox: 3, active: 4, someday: 0, done: 1, cancelled: 0 };

const setup = (overrides: Partial<ComponentProps<typeof TaskFilters>> = {}) => {
  const onFilterChange = vi.fn();
  const onEnergyChange = vi.fn();
  renderComponent(
    <TaskFilters
      activeFilter="all"
      onFilterChange={onFilterChange}
      activeEnergy="all"
      onEnergyChange={onEnergyChange}
      taskCounts={counts}
      {...overrides}
    />
  );
  return { onFilterChange, onEnergyChange };
};

describe('TaskFilters', () => {
  it('disables status tabs whose count is zero', () => {
    setup();
    // Someday (0) and Cancelled (0) are empty and inactive → disabled.
    expect(screen.getByTestId('task-filter-someday')).toBeDisabled();
    expect(screen.getByTestId('task-filter-cancelled')).toBeDisabled();
    // Non-empty ones stay enabled.
    expect(screen.getByTestId('task-filter-active')).toBeEnabled();
    expect(screen.getByTestId('task-filter-inbox')).toBeEnabled();
  });

  it('keeps the active tab enabled even when its count is zero', () => {
    setup({ activeFilter: 'someday' });
    const someday = screen.getByTestId('task-filter-someday');
    expect(someday).toBeEnabled();
    expect(someday).toHaveAttribute('aria-selected', 'true');
  });

  it('does not fire onFilterChange when a disabled tab is clicked', async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup();
    await user.click(screen.getByTestId('task-filter-cancelled'));
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('fires onFilterChange for an enabled tab', async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup();
    await user.click(screen.getByTestId('task-filter-active'));
    expect(onFilterChange).toHaveBeenCalledWith('active');
  });

  it('changes energy via the dropdown', async () => {
    const user = userEvent.setup();
    const { onEnergyChange } = setup();
    await user.click(screen.getByTestId('task-energy-filter'));
    await user.click(await screen.findByTestId('task-energy-filter-deep'));
    expect(onEnergyChange).toHaveBeenCalledWith(TaskEnergy.DEEP);
  });

  it('shows the active energy label in the trigger', () => {
    setup({ activeEnergy: TaskEnergy.LOW });
    const trigger = screen.getByTestId('task-energy-filter');
    expect(within(trigger).getByText('Low')).toBeInTheDocument();
  });
});
