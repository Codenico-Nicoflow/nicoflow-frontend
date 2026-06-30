import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { EnergyField } from '.';

interface TestFormValues {
  energy: string;
}

function TestForm({
  defaultEnergy = '',
  children,
}: {
  defaultEnergy?: string;
  children: (control: Control<TestFormValues>) => React.ReactNode;
}) {
  const methods = useForm<TestFormValues>({ defaultValues: { energy: defaultEnergy } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('EnergyField', () => {
  it('renders label and the three segments', () => {
    renderComponent(<TestForm>{control => <EnergyField control={control} />}</TestForm>);

    expect(screen.getByTestId('energy-label')).toBeInTheDocument();
    expect(screen.getByTestId('energy-option-low')).toBeInTheDocument();
    expect(screen.getByTestId('energy-option-medium')).toBeInTheDocument();
    expect(screen.getByTestId('energy-option-deep')).toBeInTheDocument();
  });

  it('defaults to medium when the form has no value', () => {
    renderComponent(<TestForm>{control => <EnergyField control={control} />}</TestForm>);

    expect(screen.getByTestId('energy-option-medium')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('energy-option-low')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows "(Optional)" when optional', () => {
    renderComponent(<TestForm>{control => <EnergyField control={control} optional />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('selecting Deep updates the form value and reflects the selection', async () => {
    const user = userEvent.setup();
    let value = '';

    const Demo = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { energy: 'medium' } });
      value = methods.watch('energy');
      return (
        <FormProvider {...methods}>
          <EnergyField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<Demo />);
    await user.click(screen.getByTestId('energy-option-deep'));

    expect(value).toBe('deep');
    expect(screen.getByTestId('energy-option-deep')).toHaveAttribute('aria-checked', 'true');
  });
});
