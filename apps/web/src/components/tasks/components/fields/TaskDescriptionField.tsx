import type { Control } from 'react-hook-form';

import type { TaskFormData } from '@my-monorepo/utils';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface TaskDescriptionFieldProps {
  control: Control<TaskFormData>;
}

const TaskDescriptionField = ({ control }: TaskDescriptionFieldProps) => {
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Description</FormLabel>
          <FormControl>
            <Textarea placeholder="Enter task description" {...field} className="min-h-[100px] resize-none" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskDescriptionField;
