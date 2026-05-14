import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { UrlField } from '.';

interface TestFormValues {
  url?: string;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({ defaultValues: { url: '' } });
  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('UrlField', () => {
  it('renders label and url input with placeholder', () => {
    renderComponent(<TestForm>{control => <UrlField control={control} />}</TestForm>);

    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });

  it('shows "(Optional)" when optional={true}', () => {
    renderComponent(<TestForm>{control => <UrlField control={control} optional={true} />}</TestForm>);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  it('does not show clear button when input is empty', () => {
    renderComponent(<TestForm>{control => <UrlField control={control} />}</TestForm>);

    expect(screen.queryByTestId('url-clear-button')).not.toBeInTheDocument();
  });

  it('clear button appears when value is present and clicking it clears the field', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { url: '' };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { url: '' } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <UrlField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByPlaceholderText('https://example.com');
    await user.type(input, 'https://example.com');

    const clearButton = screen.getByTestId('url-clear-button');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(formValues.url).toBeUndefined();
    expect(screen.queryByTestId('url-clear-button')).not.toBeInTheDocument();
  });

  it('typing a URL updates form value', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { url: '' };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({ defaultValues: { url: '' } });
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <UrlField control={methods.control} />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByPlaceholderText('https://example.com');
    await user.type(input, 'https://nicoflow.app');

    expect(formValues.url).toBe('https://nicoflow.app');
  });
});
