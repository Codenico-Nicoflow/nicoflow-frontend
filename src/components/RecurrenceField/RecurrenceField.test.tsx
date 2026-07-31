import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RecurrenceFreq } from '@/lib/types';

import { RecurrenceField } from './index';
import type { RecurrenceValue } from './types';

const weekly: RecurrenceValue = {
  freq: RecurrenceFreq.WEEKLY,
  interval: 1,
  byWeekday: [1],
  byMonthday: null,
  startDate: '2026-03-02',
  endDate: null,
};

describe('RecurrenceField', () => {
  it('renders collapsed with the toggle off when there is no value', () => {
    renderComponent(<RecurrenceField value={null} onChange={vi.fn()} />);

    expect(screen.getByTestId('recurrence-toggle')).not.toBeChecked();
    expect(screen.queryByTestId('recurrence-editor')).not.toBeInTheDocument();
  });

  it('emits a default schedule when switched on, and null when switched off', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderComponent(<RecurrenceField value={null} onChange={onChange} />);
    await user.click(screen.getByTestId('recurrence-toggle'));

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ freq: RecurrenceFreq.WEEKLY, interval: 1 });

    onChange.mockClear();
    rerender(<RecurrenceField value={weekly} onChange={onChange} />);
    await user.click(screen.getByTestId('recurrence-toggle'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
  });

  it('shows the weekday picker only for a weekly rule', () => {
    const { rerender } = renderComponent(<RecurrenceField value={weekly} onChange={vi.fn()} />);
    expect(screen.getByTestId('recurrence-weekday-1')).toBeInTheDocument();
    expect(screen.queryByTestId('recurrence-monthday')).not.toBeInTheDocument();

    rerender(<RecurrenceField value={{ ...weekly, freq: RecurrenceFreq.MONTHLY }} onChange={vi.fn()} />);
    expect(screen.queryByTestId('recurrence-weekday-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('recurrence-monthday')).toBeInTheDocument();
  });

  it('toggles a weekday on and keeps the selection sorted', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<RecurrenceField value={{ ...weekly, byWeekday: [4] }} onChange={onChange} />);

    await user.click(screen.getByTestId('recurrence-weekday-1'));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0]?.[0]?.byWeekday).toEqual([1, 4]);
  });

  it('removes an already-selected weekday', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<RecurrenceField value={{ ...weekly, byWeekday: [1, 4] }} onChange={onChange} />);

    await user.click(screen.getByTestId('recurrence-weekday-4'));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0]?.[0]?.byWeekday).toEqual([1]);
  });

  it('marks the selected weekday as pressed for assistive tech', () => {
    renderComponent(<RecurrenceField value={weekly} onChange={vi.fn()} />);

    expect(screen.getByTestId('recurrence-weekday-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('recurrence-weekday-2')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reveals the end-date input only once an end date exists', () => {
    const { rerender } = renderComponent(<RecurrenceField value={weekly} onChange={vi.fn()} />);
    expect(screen.queryByTestId('recurrence-end-date')).not.toBeInTheDocument();

    rerender(<RecurrenceField value={{ ...weekly, endDate: '2026-06-01' }} onChange={vi.fn()} />);
    expect(screen.getByTestId('recurrence-end-date')).toHaveValue('2026-06-01');
  });

  it('renders a human summary of the schedule', () => {
    renderComponent(<RecurrenceField value={{ ...weekly, interval: 2, byWeekday: [1, 4] }} onChange={vi.fn()} />);

    expect(screen.getByTestId('recurrence-summary')).toHaveTextContent(/every 2 weeks on mon, thu/i);
  });

  it('disables every control while a mutation is in flight', () => {
    renderComponent(<RecurrenceField value={weekly} onChange={vi.fn()} disabled />);

    expect(screen.getByTestId('recurrence-toggle')).toBeDisabled();
    expect(screen.getByTestId('recurrence-interval')).toBeDisabled();
    expect(screen.getByTestId('recurrence-weekday-1')).toBeDisabled();
  });

  it('starts all-day and emits the time the user picks', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<RecurrenceField value={weekly} onChange={onChange} />);

    const input = screen.getByTestId('recurrence-time');
    expect(input).toHaveValue('');

    await user.type(input, '09:00');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ scheduledTime: '09:00' });
  });

  it('snaps a typed off-grid time onto the 15-minute boundary on blur', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<RecurrenceField value={{ ...weekly, scheduledTime: '09:07' }} onChange={onChange} />);

    await user.click(screen.getByTestId('recurrence-time'));
    await user.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ scheduledTime: '09:00' })));
  });

  it('clears the time back to all-day', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<RecurrenceField value={{ ...weekly, scheduledTime: '09:00' }} onChange={onChange} />);

    await user.click(screen.getByTestId('recurrence-time-clear'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ scheduledTime: null })));
  });

  it('offers no clear button while the rule is all-day', () => {
    renderComponent(<RecurrenceField value={weekly} onChange={vi.fn()} />);

    expect(screen.queryByTestId('recurrence-time-clear')).not.toBeInTheDocument();
  });
});
