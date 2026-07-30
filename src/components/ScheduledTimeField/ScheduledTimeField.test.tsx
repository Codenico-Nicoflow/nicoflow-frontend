import { renderComponent } from '__tests__/renderComponent';
import { fireEvent, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { Form } from '@/components/ui/form';

import { ScheduledTimeField, snapTimeString } from '.';

type TimeForm = { scheduledTime?: string | null };

const Harness = ({ value, disabled }: { value?: string | null; disabled?: boolean }) => {
  const form = useForm<TimeForm>({ defaultValues: { scheduledTime: value } });
  return (
    <Form {...form}>
      <ScheduledTimeField control={form.control} disabled={disabled} />
    </Form>
  );
};

describe('snapTimeString', () => {
  it.each([
    ['09:00', '09:00'],
    ['09:07', '09:00'],
    ['09:08', '09:15'],
    ['23:55', '23:45'],
    ['00:07', '00:00'],
  ])('snaps %s to %s', (input, expected) => {
    expect(snapTimeString(input)).toBe(expected);
  });
});

describe('ScheduledTimeField', () => {
  it('snaps a typed off-boundary time on blur', () => {
    renderComponent(<Harness value="09:00" />);
    const input = screen.getByTestId('scheduled-time-input');

    fireEvent.change(input, { target: { value: '09:07' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('09:00');
  });

  it('clears to null via the clear button', () => {
    renderComponent(<Harness value="09:15" />);

    fireEvent.click(screen.getByTestId('scheduled-time-clear-button'));

    expect(screen.getByTestId('scheduled-time-input')).toHaveValue('');
  });

  it('disables the input and hides clear when no date is set', () => {
    renderComponent(<Harness value="09:15" disabled />);

    expect(screen.getByTestId('scheduled-time-input')).toBeDisabled();
    expect(screen.queryByTestId('scheduled-time-clear-button')).not.toBeInTheDocument();
  });
});
