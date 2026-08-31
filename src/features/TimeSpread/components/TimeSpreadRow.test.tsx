import { renderComponent } from '__tests__/renderComponent';
import { ActiveTab, TaskStatus } from '@nicoflow/shared/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeTask } from '@/mocks/handlers';

import TimeSpreadRow from './TimeSpreadRow';

const noop = vi.fn();

const renderRow = (taskOverrides = {}) =>
  renderComponent(
    <TimeSpreadRow task={makeTask(taskOverrides)} activeTab={ActiveTab.TODAY} onEdit={noop} onDelete={noop} />
  );

describe('TimeSpreadRow', () => {
  it('shows reschedule actions for a plain task', async () => {
    renderRow();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /actions/i }));

    expect(await screen.findByText(/tomorrow/i)).toBeInTheDocument();
  });

  it('hides reschedule actions for a recurring instance', async () => {
    renderRow({ recurrenceRuleId: 'rr1', occurrenceDate: '2026-08-31' });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /actions/i }));

    expect(screen.queryByText(/tomorrow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove from schedule/i)).not.toBeInTheDocument();
  });

  it('enables the checkbox for an active recurring task', async () => {
    renderRow({ recurrenceRuleId: 'rr1', occurrenceDate: '2026-08-31', status: TaskStatus.ACTIVE });

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
  });

  it('disables the checkbox for a done recurring task', async () => {
    renderRow({ recurrenceRuleId: 'rr1', occurrenceDate: '2026-08-31', status: TaskStatus.DONE });

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('enables the checkbox for a done non-recurring task (can uncomplete)', async () => {
    renderRow({ status: TaskStatus.DONE });

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
  });
});
