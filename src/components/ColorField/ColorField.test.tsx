import React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { ColorField } from '.';

interface TestFormValues {
  color?: string;
}

function TestForm({
  children,
  onState,
}: {
  children: (control: Control<TestFormValues>) => React.ReactNode;
  onState?: (value?: string) => void;
}) {
  const methods = useForm<TestFormValues>({ defaultValues: { color: '#3B82F6' } });
  onState?.(methods.watch('color'));
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('ColorField', () => {
  it('renders the label and exposes the color name via the trigger accessible name', () => {
    renderComponent(<TestForm>{control => <ColorField control={control} label="Area Color" />}</TestForm>);

    expect(screen.getByText('Area Color')).toBeInTheDocument();
    // The trigger is swatch-only (no visible text); the friendly preset name is
    // the accessible name instead.
    expect(screen.getByTestId('color-trigger')).toHaveAccessibleName('Blue');
  });

  it('opens the swatch palette and selecting a swatch updates the form value', async () => {
    const user = userEvent.setup();
    const onState = vi.fn();

    renderComponent(<TestForm onState={onState}>{control => <ColorField control={control} />}</TestForm>);

    await user.click(screen.getByTestId('color-trigger'));
    expect(screen.getByTestId('color-swatches')).toBeInTheDocument();

    // Ember preset (swatches are labelled by name now).
    await user.click(screen.getByLabelText('Ember'));

    expect(onState).toHaveBeenLastCalledWith('#c4622d');
  });
});
