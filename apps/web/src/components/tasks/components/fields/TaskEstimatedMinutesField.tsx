import { X } from 'lucide-react';
import type { Control } from 'react-hook-form';

import type { TaskFormData } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TaskEstimatedMinutesFieldProps {
  control: Control<TaskFormData>;
}

const TaskEstimatedMinutesField = ({ control }: TaskEstimatedMinutesFieldProps) => {
  return (
    <FormField
      control={control}
      name="estimatedMinutes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Estimated Time (minutes)</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type="number"
                placeholder="Enter estimated time"
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || value === null) {
                    field.onChange(undefined);
                  } else {
                    const parsed = parseInt(value);
                    field.onChange(isNaN(parsed) ? undefined : parsed);
                  }
                }}
                value={field.value ?? ''}
                className="h-10 pr-10"
                min="1"
                max="1440"
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            {field.value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  field.onChange(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FormDescription className="text-xs">How long will this task take?</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskEstimatedMinutesField;
