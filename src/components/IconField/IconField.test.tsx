import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { IconField } from '.';

interface TestFormValues {
  icon?: string;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { icon: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('IconField', () => {
  it('renders label and select trigger', () => {
    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <TestForm>{control => <IconField control={control} label="Icon" />}</TestForm>
      </React.Suspense>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trigger')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <TestForm>{control => <IconField control={control} label="Icon" optional={true} />}</TestForm>
      </React.Suspense>
    );

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('opens select content on trigger click showing icon options', async () => {
    const user = userEvent.setup();

    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <TestForm>{control => <IconField control={control} label="Pick an icon" />}</TestForm>
      </React.Suspense>
    );

    const trigger = screen.getByTestId('icon-trigger');
    await user.click(trigger);

    expect(screen.getByTestId('icon-content')).toBeInTheDocument();
  });
});
