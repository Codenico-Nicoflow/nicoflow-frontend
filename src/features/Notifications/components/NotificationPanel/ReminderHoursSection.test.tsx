import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReminderHoursSection } from './ReminderHoursSection';

const baseProps = {
  morningHour: 8,
  eveningHour: 20,
  isLoading: false,
  isSaving: false,
  onChange: vi.fn(),
};

describe('ReminderHoursSection', () => {
  it('shows skeletons while loading, not the pickers', () => {
    renderComponent(<ReminderHoursSection {...baseProps} isLoading onChange={vi.fn()} />);
    expect(screen.getByTestId('hours-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('morning-hour')).not.toBeInTheDocument();
  });

  it('renders both hour pickers with the persisted values once loaded', () => {
    renderComponent(<ReminderHoursSection {...baseProps} onChange={vi.fn()} />);
    // Radix SelectValue renders the formatted label of the current value.
    expect(screen.getByTestId('morning-hour')).toHaveTextContent('8:00 AM');
    expect(screen.getByTestId('evening-hour')).toHaveTextContent('8:00 PM');
  });

  it('disables both pickers while saving so a control never shows an uncommitted value', () => {
    renderComponent(<ReminderHoursSection {...baseProps} isSaving onChange={vi.fn()} />);
    expect(screen.getByTestId('morning-hour')).toBeDisabled();
    expect(screen.getByTestId('evening-hour')).toBeDisabled();
  });
});
