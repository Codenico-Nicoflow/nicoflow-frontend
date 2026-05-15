import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { DescriptionField } from '.';

interface TestFormValues {
  description: string;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { description: '' } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('DescriptionField', () => {
  it('renders label and textarea with placeholder', () => {
    renderComponent(
      <TestForm>
        {control => <DescriptionField control={control} label="Notes" placeholder="Add your notes here" />}
      </TestForm>
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add your notes here')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional prop is true', () => {
    renderComponent(
      <TestForm>
        {control => (
          <DescriptionField control={control} label="Notes" placeholder="Add your notes here" optional={true} />
        )}
      </TestForm>
    );

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('does not show "(Optional)" by default', () => {
    renderComponent(
      <TestForm>
        {control => <DescriptionField control={control} label="Notes" placeholder="Enter description" />}
      </TestForm>
    );

    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument();
  });

  it('typing updates form value', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { description: '' };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { description: '' } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <DescriptionField control={methods.control} label="Notes" placeholder="Enter description" />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const textarea = screen.getByPlaceholderText('Enter description');
    await user.type(textarea, 'Hello world');

    expect(formValues.description).toBe('Hello world');
  });
});
