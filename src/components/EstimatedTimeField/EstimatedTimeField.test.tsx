import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { EstimatedTimeField } from '.';

interface TestFormValues {
  estimatedMinutes?: number;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('EstimatedTimeField', () => {
  it('renders label and number input', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.getByText('Estimated Time')).toBeInTheDocument();
    expect(screen.getByTestId('estimated-time-input')).toBeInTheDocument();
  });

  it('shows the "minutes" unit suffix', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.getByText('minutes')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('typing a number updates form value', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { estimatedMinutes: undefined };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: undefined } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <EstimatedTimeField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByTestId('estimated-time-input');
    await user.type(input, '45');

    expect(formValues.estimatedMinutes).toBe(45);
  });

  it('does not render a stray "0" when value is 0', () => {
    const ZeroForm = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: 0 } });
      return (
        <FormProvider {...methods}>
          <EstimatedTimeField control={methods.control} />
        </FormProvider>
      );
    };

    const { container } = renderComponent(<ZeroForm />);
    // The "0 && <Button/>" bug rendered a literal "0" text node next to the input.
    expect(container.textContent).not.toMatch(/(^|[^\d])0([^\d]|$)/);
  });

  it('clear button not visible when no value', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.queryByTestId('estimated-time-clear-button')).not.toBeInTheDocument();
  });

  it('clear button visible when value set and click clears it', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { estimatedMinutes: undefined };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: undefined } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <EstimatedTimeField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByTestId('estimated-time-input');
    await user.type(input, '30');

    const clearButton = screen.getByTestId('estimated-time-clear-button');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(formValues.estimatedMinutes).toBeNull();
    expect(screen.queryByTestId('estimated-time-clear-button')).not.toBeInTheDocument();
  });

  it('empty string input sets field to undefined', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { estimatedMinutes: undefined };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: undefined } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <EstimatedTimeField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByTestId('estimated-time-input');
    await user.type(input, '5');
    await user.clear(input);

    expect(formValues.estimatedMinutes).toBeUndefined();
  });
});
