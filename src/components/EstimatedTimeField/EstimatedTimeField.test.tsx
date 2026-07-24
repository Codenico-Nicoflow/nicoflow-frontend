import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { EstimatedTimeField } from '.';

interface TestFormValues {
  estimatedMinutes?: number | null;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: undefined } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

function WatchForm({
  defaultValue,
  onValues,
}: {
  defaultValue?: number | null;
  onValues: (v: TestFormValues) => void;
}) {
  const methods = useForm<TestFormValues>({ defaultValues: { estimatedMinutes: defaultValue } });
  onValues(methods.watch());
  return (
    <FormProvider {...methods}>
      <form>
        <EstimatedTimeField control={methods.control} />
      </form>
    </FormProvider>
  );
}

describe('EstimatedTimeField', () => {
  it('renders the label and all preset chips', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.getByText('Estimated Time')).toBeInTheDocument();
    expect(screen.getByTestId('chip-15')).toBeInTheDocument();
    expect(screen.getByTestId('chip-30')).toBeInTheDocument();
    expect(screen.getByTestId('chip-60')).toBeInTheDocument();
    expect(screen.getByTestId('chip-120')).toBeInTheDocument();
    expect(screen.getByTestId('chip-240')).toBeInTheDocument();
    expect(screen.getByTestId('chip-480')).toBeInTheDocument();
    expect(screen.getByTestId('chip-custom')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('clicking a preset chip sets the correct minutes value', async () => {
    const user = userEvent.setup();
    let captured: TestFormValues = {};

    renderComponent(
      <WatchForm
        defaultValue={undefined}
        onValues={v => {
          captured = v;
        }}
      />
    );

    await user.click(screen.getByTestId('chip-60'));

    await waitFor(() => {
      expect(captured.estimatedMinutes).toBe(60);
    });
  });

  it('active preset chip has aria-pressed=true, others have aria-pressed=false', async () => {
    const user = userEvent.setup();

    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    await user.click(screen.getByTestId('chip-30'));

    await waitFor(() => {
      expect(screen.getByTestId('chip-30')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('chip-60')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('Custom chip reveals the number input when clicked', async () => {
    const user = userEvent.setup();

    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.queryByTestId('estimated-time-input')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('chip-custom'));

    await waitFor(() => {
      expect(screen.getByTestId('estimated-time-input')).toBeInTheDocument();
    });
  });

  it('off-chip legacy value activates Custom chip and preserves the value', () => {
    let captured: TestFormValues = {};

    renderComponent(
      <WatchForm
        defaultValue={47}
        onValues={v => {
          captured = v;
        }}
      />
    );

    expect(screen.getByTestId('chip-custom')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('estimated-time-input')).toBeInTheDocument();
    expect(captured.estimatedMinutes).toBe(47);
  });

  it('typing a value in the custom input updates the form', async () => {
    const user = userEvent.setup();
    let captured: TestFormValues = {};

    // Open custom mode from scratch (no initial value), then type
    renderComponent(
      <WatchForm
        defaultValue={undefined}
        onValues={v => {
          captured = v;
        }}
      />
    );

    await user.click(screen.getByTestId('chip-custom'));

    await waitFor(() => expect(screen.getByTestId('estimated-time-input')).toBeInTheDocument());

    await user.type(screen.getByTestId('estimated-time-input'), '90');

    await waitFor(() => {
      expect(captured.estimatedMinutes).toBe(90);
    });
  });

  it('clear button is not visible when no value', () => {
    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    expect(screen.queryByTestId('estimated-time-clear-button')).not.toBeInTheDocument();
  });

  it('clear button appears after preset selection and click resets to null', async () => {
    const user = userEvent.setup();
    let captured: TestFormValues = {};

    renderComponent(
      <WatchForm
        defaultValue={undefined}
        onValues={v => {
          captured = v;
        }}
      />
    );

    await user.click(screen.getByTestId('chip-120'));

    await waitFor(() => {
      expect(screen.getByTestId('estimated-time-clear-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('estimated-time-clear-button'));

    await waitFor(() => {
      expect(captured.estimatedMinutes).toBeNull();
      expect(screen.queryByTestId('estimated-time-clear-button')).not.toBeInTheDocument();
    });
  });

  it('preset chips are keyboard operable via Enter', async () => {
    const user = userEvent.setup();
    let captured: TestFormValues = {};

    renderComponent(
      <WatchForm
        defaultValue={undefined}
        onValues={v => {
          captured = v;
        }}
      />
    );

    const chip = screen.getByTestId('chip-240');
    chip.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(captured.estimatedMinutes).toBe(240);
    });
  });

  it('switching from custom value back to a preset deactivates the Custom chip', async () => {
    const user = userEvent.setup();

    renderComponent(<TestForm>{control => <EstimatedTimeField control={control} />}</TestForm>);

    await user.click(screen.getByTestId('chip-custom'));
    await waitFor(() => expect(screen.getByTestId('estimated-time-input')).toBeInTheDocument());

    const input = screen.getByTestId('estimated-time-input');
    await user.type(input, '47');

    await user.click(screen.getByTestId('chip-30'));

    await waitFor(() => {
      expect(screen.getByTestId('chip-30')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('chip-custom')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByTestId('estimated-time-input')).not.toBeInTheDocument();
    });
  });
});
