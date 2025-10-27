import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { Control } from 'react-hook-form';

import type { TaskFormData } from '@my-monorepo/utils';
import { isDateInPast } from '@my-monorepo/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskDueDateFieldProps {
  control: Control<TaskFormData>;
}

const TaskDueDateField = ({ control }: TaskDueDateFieldProps) => {
  return (
    <FormField
      control={control}
      name="dueDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-sm font-medium">Due Date</FormLabel>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-10 w-full pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground',
                      field.value && 'pr-10'
                    )}
                  >
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  disabled={date => isDateInPast(date)}
                  mode="single"
                  required={false}
                  selected={field.value || undefined}
                  onSelect={field.onChange}
                />
              </PopoverContent>
            </Popover>
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskDueDateField;
