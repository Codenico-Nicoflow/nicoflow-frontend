import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Folder } from 'lucide-react';
import { type Control, FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { NameField } from '.';

interface TestFormValues {
  name: string;
}

function TestForm({ children }: { children: (control: Control<TestFormValues>) => React.ReactNode }) {
  const methods = useForm<TestFormValues>({
    defaultValues: {
      name: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children(methods.control)}</form>
    </FormProvider>
  );
}

describe('NameField', () => {
  it('should render with label, icon and input', () => {
    renderComponent(
      <TestForm>
        {control => <NameField control={control} label="Project Name" icon={Folder} placeholder="Enter name" />}
      </TestForm>
    );

    expect(screen.getByText('Project Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('should update form value when user enters text', async () => {
    const user = userEvent.setup();
    let formValues: TestFormValues = { name: '' };

    const TestComponent = () => {
      const methods = useForm<TestFormValues>({
        defaultValues: { name: '' },
      });

      formValues = methods.watch();

      return (
        <FormProvider {...methods}>
          <NameField control={methods.control} label="Name" icon={Folder} placeholder="Enter name" fieldName="name" />
        </FormProvider>
      );
    };

    renderComponent(<TestComponent />);

    const input = screen.getByPlaceholderText('Enter name');
    await user.type(input, 'My Project');

    expect(formValues.name).toBe('My Project');
  });

  it('should apply animation with custom delay', () => {
    renderComponent(
      <TestForm>
        {control => <NameField control={control} label="Name" icon={Folder} placeholder="Enter name" delay={0.5} />}
      </TestForm>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
