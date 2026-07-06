import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { DueDateField } from '.';

interface TestFormValues {
  dueDate?: Date;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { dueDate: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('DueDateField', () => {
  it('renders label and trigger button with placeholder text', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('does not show clear button when no value is set', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} />}</TestForm>);

    expect(screen.queryByTestId('due-date-clear-button')).not.toBeInTheDocument();
  });

  it('shows clear button when the field has a preset value', () => {
    const TestWithValue = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { dueDate: new Date('2025-12-31') } });
      return (
        <FormProvider {...methods}>
          <form>
            <DueDateField control={methods.control} />
          </form>
        </FormProvider>
      );
    };

    renderComponent(<TestWithValue />);

    expect(screen.getByTestId('due-date-clear-button')).toBeInTheDocument();
    expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();
  });

  it('clicking clear resets the UI — placeholder returns and clear button disappears', async () => {
    const user = userEvent.setup();

    const TestWithValue = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { dueDate: new Date('2025-12-31') } });
      return (
        <FormProvider {...methods}>
          <form>
            <DueDateField control={methods.control} />
          </form>
        </FormProvider>
      );
    };

    renderComponent(<TestWithValue />);

    // Precondition: a date is shown, no placeholder.
    expect(screen.queryByText('Pick a date')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('due-date-clear-button'));

    // The bug: clearing updated form state but not the UI. Assert the UI actually resets.
    expect(await screen.findByText('Pick a date')).toBeInTheDocument();
    expect(screen.queryByTestId('due-date-clear-button')).not.toBeInTheDocument();
  });

  it('renders custom label', () => {
    renderComponent(<TestForm>{control => <DueDateField control={control} label="Deadline" />}</TestForm>);

    expect(screen.getByText('Deadline')).toBeInTheDocument();
  });
});
