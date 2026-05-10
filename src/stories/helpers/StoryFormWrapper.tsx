import type { Control, DefaultValues, FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { Form } from '@/components/ui/form';

interface StoryFormWrapperProps<T extends FieldValues> {
  defaultValues: DefaultValues<T>;
  children: (control: Control<T>) => React.ReactNode;
}

export function StoryFormWrapper<T extends FieldValues>({ defaultValues, children }: StoryFormWrapperProps<T>) {
  const form = useForm<T>({ defaultValues });

  return (
    <Form {...form}>
      <form className="w-[400px] space-y-4">{children(form.control)}</form>
    </Form>
  );
}
