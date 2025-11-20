import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { CheckboxField } from '.';

interface TestFormValues {
  isActive: boolean;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({
    defaultValues: {
      isActive: false,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('CheckboxField', () => {
  it('should render checkbox with label and icon', () => {
    renderComponent(
      <TestForm>
        {control => <CheckboxField control={control} label="Mark as favorite" icon={Star} fieldName="isActive" />}
      </TestForm>
    );

    expect(screen.getByText('Mark as favorite')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should toggle checkbox value when clicked', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { isActive: false };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({
        defaultValues: { isActive: false },
      });

      formValues = methods.watch();

      return (
        <FormProvider {...methods}>
          <CheckboxField control={methods.control} label="Active" icon={Star} fieldName="isActive" />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(formValues.isActive).toBe(true);

    await user.click(checkbox);
    expect(formValues.isActive).toBe(false);
  });

  it('should display optional description when provided', () => {
    renderComponent(
      <TestForm>
        {control => (
          <CheckboxField
            control={control}
            label="Enable feature"
            description="This will enable the advanced feature"
            icon={Star}
            fieldName="isActive"
          />
        )}
      </TestForm>
    );

    expect(screen.getByText('This will enable the advanced feature')).toBeInTheDocument();
  });
});
