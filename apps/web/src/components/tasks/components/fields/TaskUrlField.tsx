import { Link, X } from 'lucide-react';
import { type Control } from 'react-hook-form';

import { type TaskFormData } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TaskUrlFieldProps {
  control: Control<TaskFormData>;
}

const TaskUrlField = ({ control }: TaskUrlFieldProps) => {
  return (
    <FormField
      control={control}
      name="url"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="https://example.com"
                className="h-10 pr-10"
                value={field.value || ''}
              />
            </FormControl>
            {field.value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                onClick={() => field.onChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskUrlField;
