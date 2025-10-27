import type { Control } from 'react-hook-form';

import type { TaskFormData } from '@my-monorepo/utils';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TaskNameFieldProps {
  control: Control<TaskFormData>;
}

const TaskNameField = ({ control }: TaskNameFieldProps) => {
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Task Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter task name" {...field} className="h-10" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskNameField;
