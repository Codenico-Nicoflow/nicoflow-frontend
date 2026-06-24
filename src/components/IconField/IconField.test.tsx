import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { IconField } from '.';

interface TestFormValues {
  icon?: string;
}

function TestForm({
  children,
  onState,
}: {
  children: (control: Control<TestFormValues>) => React.ReactNode;
  onState?: (value?: string) => void;
}) {
  const methods = useForm<TestFormValues>({ defaultValues: { icon: 'briefcase' } });
  onState?.(methods.watch('icon'));
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('IconField', () => {
  it('renders label and icon trigger', () => {
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

  it('exposes the current icon name via the trigger accessible name', () => {
    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <TestForm>{control => <IconField control={control} />}</TestForm>
      </React.Suspense>
    );

    // The trigger is icon-only (no visible text); the friendly name is the
    // accessible name instead.
    expect(screen.getByTestId('icon-trigger')).toHaveAccessibleName('Briefcase');
  });

  it('opens the icon grid on trigger click and selecting an icon updates the form value', async () => {
    const user = userEvent.setup();
    const onState = vi.fn();

    renderComponent(
      <React.Suspense fallback={<div>loading</div>}>
        <TestForm onState={onState}>{control => <IconField control={control} />}</TestForm>
      </React.Suspense>
    );

    await user.click(screen.getByTestId('icon-trigger'));
    expect(screen.getByTestId('icon-content')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Folder'));
    expect(onState).toHaveBeenLastCalledWith('folder');
  });
});
