import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { PriorityField } from '.';

interface TestFormValues {
  priority: string;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { priority: '' } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('PriorityField', () => {
  it('renders label and select trigger', () => {
    renderComponent(<TestForm>{control => <PriorityField control={control} />}</TestForm>);

    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByTestId('priority-trigger')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <PriorityField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('all three priority options visible after opening', async () => {
    const user = userEvent.setup();

    renderComponent(<TestForm>{control => <PriorityField control={control} />}</TestForm>);

    await user.click(screen.getByTestId('priority-trigger'));

    // Radix Select renders both hidden <option> elements and visible <span> items;
    // assert at least one of each label is present
    expect(screen.getAllByText('Low').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1);
  });

  it('selecting an option updates form value', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { priority: '' };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { priority: '' } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <PriorityField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    await user.click(screen.getByTestId('priority-trigger'));
    const highOptions = screen.getAllByText('High');
    await user.click(highOptions[highOptions.length - 1] as Element);

    expect(formValues.priority).toBe('high');
  });
});
