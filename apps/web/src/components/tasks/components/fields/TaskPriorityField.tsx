import type { Control } from 'react-hook-form';

import type { TaskFormData } from '@my-monorepo/utils';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskPriorityFieldProps {
  control: Control<TaskFormData>;
}

const TaskPriorityField = ({ control }: TaskPriorityFieldProps) => {
  return (
    <FormField
      control={control}
      name="priority"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Priority</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskPriorityField;
