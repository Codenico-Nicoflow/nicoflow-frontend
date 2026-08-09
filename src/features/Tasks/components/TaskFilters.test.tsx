import { renderComponent } from '__tests__/renderComponent';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ScheduleFilter, TaskEnergy } from '@/lib/types';

import { type TaskCounts } from '../filters';

import TaskFilters from './TaskFilters';

const counts: TaskCounts = { all: 8, active: 4, done: 1, cancelled: 0 };

const setup = (overrides: Partial<ComponentProps<typeof TaskFilters>> = {}) => {
  const onFilterChange = vi.fn();
  const onEnergyChange = vi.fn();
  const onScheduleFilterChange = vi.fn();
  renderComponent(
    <TaskFilters
      activeFilter="all"
      onFilterChange={onFilterChange}
      activeEnergy="all"
      onEnergyChange={onEnergyChange}
      taskCounts={counts}
      scheduleFilter={ScheduleFilter.ALL}
      onScheduleFilterChange={onScheduleFilterChange}
      {...overrides}
    />
  );
  return { onFilterChange, onEnergyChange, onScheduleFilterChange };
};

describe('TaskFilters', () => {
  it('disables status tabs whose count is zero', () => {
    setup();
    // Cancelled (0) is empty and inactive → disabled.
    expect(screen.getByTestId('task-filter-cancelled')).toBeDisabled();
    // Non-empty ones stay enabled.
    expect(screen.getByTestId('task-filter-active')).toBeEnabled();
    expect(screen.getByTestId('task-filter-done')).toBeEnabled();
  });

  it('keeps the active tab enabled even when its count is zero', () => {
    setup({ activeFilter: 'cancelled' });
    const cancelled = screen.getByTestId('task-filter-cancelled');
    expect(cancelled).toBeEnabled();
    expect(cancelled).toHaveAttribute('aria-selected', 'true');
  });

  it('only shows the schedule chip under the Active tab', () => {
    setup({ activeFilter: 'active' });
    expect(screen.getByTestId('task-schedule-filter-all')).toBeInTheDocument();
  });

  it('hides the schedule chip outside the Active tab', () => {
    setup({ activeFilter: 'done' });
    expect(screen.queryByTestId('task-schedule-filter-all')).not.toBeInTheDocument();
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
